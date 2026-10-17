import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v } from './felles3d';

/**
 * Rørosvidda i 3D: bergstaden med smeltehytta, gruvefjellet Storwartz, skogen rundt og
 * vidda utenfor. Fire modus: vinterkvelden med sledene som kommer inn, gruvefjellet,
 * skogen som forsvinner i en ring rundt smeltehytta, og reinflokken på vidda.
 */

type Modus = 'vinter' | 'gruve' | 'skog' | 'rein';

const HYTTA = v(6, 0, 0);
const GRUVA = v(70, 0, -55);
const FLOKK = v(-70, 0, 55);

/** Sledeveien inn mot smeltehytta, over et frosset vann. */
const VEI = new THREE.CatmullRomCurve3([
    v(110, 0, 95),
    v(80, 0, 70),
    v(52, 0, 46),
    v(30, 0, 22),
    v(14, 0, 7),
]);

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'vinter') {
        switch (beat) {
            case 0:
                return { pos: v(-40 + t * 0.6, 22, 70), se: v(10, 2, 0) };
            case 1:
                return { pos: v(118, 9, 58), se: v(78, 1, 72) };
            case 2:
                return { pos: v(64 - t * 0.3, 4.5, 82), se: v(76, 1.2, 66) };
            default:
                return { pos: v(34, 10, 40 - t * 0.3), se: v(4, 3, 0) };
        }
    }
    if (modus === 'gruve') {
        switch (beat) {
            case 0:
                return { pos: v(96, 16, -18), se: v(70, 6, -55) };
            case 1:
                return { pos: v(80 - t * 0.2, 6, -12), se: v(70, 2.5, -31) };
            case 2:
                return { pos: v(40, 30, 10), se: v(66, 4, -48) };
            case 3:
                return { pos: v(-30, 34, 70), se: v(30, 0, -20) };
            default:
                return { pos: v(24, 10, 26), se: v(6, 3, 0) };
        }
    }
    if (modus === 'skog') {
        switch (beat) {
            case 0:
                return { pos: v(28, 10, 26), se: v(6, 4, 0) };
            case 1:
                return { pos: v(44, 7, 40), se: v(30, 2, 25) };
            case 2:
            case 3:
                return { pos: v(-10 + t * 0.5, 80, 100), se: v(6, 0, 0) };
            case 4:
                return { pos: v(26, 12, 30), se: v(4, 7, 0) };
            default:
                return { pos: v(40, 9, 8), se: v(14, 2, -10) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(-150, 30, 140), se: v(-70, 0, 55) };
        case 1:
            return { pos: v(-92 + t * 0.4, 5, 72), se: v(-70, 1, 55) };
        case 2:
            return { pos: v(-88, 4, 72), se: v(-66, 1.2, 55) };
        case 3:
            return { pos: v(-100, 12, 95), se: v(-10, 4, 0) };
        default:
            return { pos: v(-150, 60, 170), se: v(-20, 0, 20) };
    }
}

/** Hvor langt ut fra smeltehytta skogen er hugget ned, per beat. */
function hogstFor(modus: Modus, beat: number) {
    if (modus === 'gruve') return 0;
    if (modus === 'skog') return beat < 2 ? 0 : beat === 2 ? 30 : 58;
    return 58;
}

const mat = {
    tre: new THREE.MeshStandardMaterial({ color: '#7a4a2a', roughness: 0.9, flatShading: true }),
    tak: new THREE.MeshStandardMaterial({ color: '#4d5a3a', roughness: 0.95, flatShading: true }),
    taksno: new THREE.MeshStandardMaterial({
        color: '#f4f7fa',
        emissive: '#9aaabb',
        emissiveIntensity: 0.3,
        flatShading: true,
    }),
    hytte: new THREE.MeshStandardMaterial({ color: '#3b2a20', roughness: 0.9, flatShading: true }),
    stein: new THREE.MeshStandardMaterial({ color: '#6b6560', roughness: 1, flatShading: true }),
    fjell: new THREE.MeshStandardMaterial({ color: '#77735f', emissive: '#22231a', roughness: 1, flatShading: true }),
    ring: new THREE.MeshBasicMaterial({ color: '#c2410c', transparent: true, opacity: 0.85 }),
    slagg: new THREE.MeshStandardMaterial({ color: '#1d1d22', roughness: 0.6, flatShading: true }),
    malm: new THREE.MeshStandardMaterial({ color: '#8a4b2a', roughness: 0.9, flatShading: true }),
    lys: new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff8a1f', emissiveIntensity: 1.4 }),
    svart: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9 }),
    hest: new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: 0.9, flatShading: true }),
    sekk: new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.9 }),
    ved: new THREE.MeshStandardMaterial({ color: '#a77b4f', roughness: 0.9 }),
    rok: new THREE.MeshStandardMaterial({
        color: '#7d828a',
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        roughness: 1,
    }),
    is: new THREE.MeshStandardMaterial({ color: '#c9dceb', emissive: '#7f9fb8', emissiveIntensity: 0.35, roughness: 0.3 }),
    skog: new THREE.MeshStandardMaterial({ color: '#2f5a3a', emissive: '#10231a', roughness: 0.9, flatShading: true }),
    stubbe: new THREE.MeshStandardMaterial({ color: '#d2b48c', emissive: '#5a4630', roughness: 1 }),
    rein: new THREE.MeshStandardMaterial({ color: '#8a7a68', roughness: 0.9, flatShading: true }),
    reinlys: new THREE.MeshStandardMaterial({ color: '#e9e2d6', roughness: 0.9, flatShading: true }),
    horn: new THREE.MeshStandardMaterial({ color: '#d8c7a6', roughness: 0.8 }),
};

/** Små trehus i to gater, med torvtak (snø på taket om vinteren). */
function Bergstaden({ vinter }: { vinter: boolean }) {
    const hus = useMemo(() => {
        const ut: { x: number; z: number; b: number; d: number; r: number }[] = [];
        for (let i = 0; i < 9; i++) {
            ut.push({ x: -6 - i * 4.2, z: -5 + frø(i) * 0.8, b: 3.2, d: 2.6, r: 0 });
            ut.push({ x: -6 - i * 4.2, z: 5 + frø(i + 30) * 0.8, b: 3.2, d: 2.6, r: 0 });
        }
        for (let i = 0; i < 5; i++) ut.push({ x: -14 - i * 5, z: 12, b: 3.6, d: 2.8, r: 0.1 });
        return ut;
    }, []);
    return (
        <group>
            {hus.map((h, i) => (
                <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.r, 0]}>
                    <mesh material={mat.tre} position={[0, 1.1, 0]}>
                        <boxGeometry args={[h.b, 2.2, h.d]} />
                    </mesh>
                    <mesh
                        material={vinter ? mat.taksno : mat.tak}
                        position={[0, 2.6, 0]}
                        rotation={[0, 0, 0]}
                        scale={[h.b * 0.58, 1, h.d * 0.78]}
                    >
                        <coneGeometry args={[1.25, 1.1, 4, 1]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** Smeltehytta: et langt, mørkt hus med stor skorstein og glød i døra. */
function Smeltehytta() {
    return (
        <group position={HYTTA.toArray()}>
            <mesh material={mat.hytte} position={[0, 2.4, 0]}>
                <boxGeometry args={[11, 4.8, 6]} />
            </mesh>
            <mesh material={mat.svart} position={[0, 5.4, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.6, 1, 0.95]}>
                <coneGeometry args={[4.6, 1.8, 4, 1]} />
            </mesh>
            <mesh material={mat.stein} position={[-2.5, 7.5, 0]}>
                <boxGeometry args={[2, 7, 2]} />
            </mesh>
            <mesh material={mat.stein} position={[3, 6.6, 0]}>
                <boxGeometry args={[1.4, 5, 1.4]} />
            </mesh>
            <mesh material={mat.lys} position={[1, 1.3, 3.02]}>
                <planeGeometry args={[2.2, 2.4]} />
            </mesh>
            <pointLight position={[1, 2, 5]} color="#ff9a3c" intensity={30} distance={22} />
        </group>
    );
}

/** Røyk som stiger fra skorsteinene og driver bort fra kameraene. */
function Royk({ playing, mengde }: { playing: boolean; mengde: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const N = 22;
    const m = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const g = ref.current;
        if (!g) return;
        for (let i = 0; i < N; i++) {
            const fase = (tid.current * 0.07 + i / N) % 1;
            const kilde = i % 2 === 0 ? [-2.5, 11] : [3, 9.1];
            m.position.set(
                HYTTA.x + kilde[0] - fase * 26,
                kilde[1] + fase * 16,
                HYTTA.z - fase * 22
            );
            m.scale.setScalar((0.9 + fase * 4.5) * mengde);
            m.updateMatrix();
            g.setMatrixAt(i, m.matrix);
        }
        g.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, N]} material={mat.rok}>
            <icosahedronGeometry args={[1, 1]} />
        </instancedMesh>
    );
}

/** Svarte slagghauger ved smeltehytta. */
function Slagg({ stor }: { stor: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, stor ? 1.8 : 1, 2, Math.min(dt, 0.05));
        g.scale.set(1, s, 1);
    });
    const hauger = [
        [18, -10, 3.4],
        [22, -3, 2.6],
        [12, -16, 2.2],
        [24, -15, 3],
        [6, -20, 1.8],
    ];
    return (
        <group ref={ref}>
            {hauger.map(([x, z, r], i) => (
                <mesh key={i} material={mat.slagg} position={[x, r * 0.35, z]}>
                    <coneGeometry args={[r * 1.6, r * 1.4, 7, 1]} />
                </mesh>
            ))}
        </group>
    );
}

/** Gruvefjellet med inngang, malmhaug og et lite hus over sjakta. */
function Gruvefjellet() {
    return (
        <group position={GRUVA.toArray()}>
            <mesh material={mat.fjell} position={[0, -2, 0]} scale={[1.6, 0.55, 1.2]}>
                <sphereGeometry args={[22, 12, 8]} />
            </mesh>
            {/* Inngangen ved foten av fjellet, mot kameraet */}
            <mesh material={mat.tre} position={[0, 2.4, 25]}>
                <boxGeometry args={[5.2, 4.8, 2.4]} />
            </mesh>
            <mesh material={mat.svart} position={[0, 1.9, 26.25]}>
                <planeGeometry args={[3.2, 3.6]} />
            </mesh>
            {/* Rødbrun malmhaug */}
            {[0, 1, 2].map((i) => (
                <mesh key={i} material={mat.malm} position={[6 + i * 2.6, 1 + i * 0.3, 27 - i * 1.5]}>
                    <dodecahedronGeometry args={[2.2 - i * 0.4, 0]} />
                </mesh>
            ))}
            {/* Hus over sjakta */}
            <group position={[-2, 11.4, 6]}>
                <mesh material={mat.tre} position={[0, 1.4, 0]}>
                    <boxGeometry args={[4, 2.8, 3]} />
                </mesh>
                <mesh material={mat.tak} position={[0, 3.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <coneGeometry args={[3, 1.4, 4, 1]} />
                </mesh>
            </group>
        </group>
    );
}

/** Skogen: ett instansert mesh. Trær innenfor hogstradien krymper til stubber. */
function Skog({ hogst }: { hogst: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const stubber = useRef<THREE.InstancedMesh>(null);
    const radius = useRef(hogst);
    const skrevet = useRef(-1);
    const forste = useRef(true);
    const trær = useMemo(() => {
        const ut: { x: number; z: number; s: number; d: number }[] = [];
        for (let i = 0; ut.length < 650 && i < 4000; i++) {
            const r = 16 + Math.sqrt(frø(i)) * 150;
            const a = frø(i + 999) * Math.PI * 2;
            const x = HYTTA.x + Math.cos(a) * r;
            const z = HYTTA.z + Math.sin(a) * r;
            // Hold byen, gruvefjellet, sledeveien og reinbeitet åpent.
            if (x < 4 && x > -50 && Math.abs(z) < 20) continue;
            if (Math.hypot(x - GRUVA.x, z - GRUVA.z) < 40) continue;
            if (Math.hypot(x - FLOKK.x, z - FLOKK.z) < 30) continue;
            if (x > 20 && Math.abs(z - x * 0.86) < 12) continue;
            if (Math.hypot(x - 66, z - 80) < 14) continue;
            ut.push({ x, z, s: 0.8 + frø(i + 7) * 0.7, d: Math.hypot(x - HYTTA.x, z - HYTTA.z) });
        }
        return ut;
    }, []);
    const o = useMemo(() => new THREE.Object3D(), []);

    const skriv = (r: number) => {
        const g = ref.current;
        const st = stubber.current;
        if (!g || !st) return;
        skrevet.current = r;
        trær.forEach((t, i) => {
            const borte = t.d < r;
            o.position.set(t.x, borte ? -10 : 2.4 * t.s, t.z);
            o.scale.setScalar(borte ? 0.001 : t.s);
            o.updateMatrix();
            g.setMatrixAt(i, o.matrix);
            o.position.set(t.x, borte ? 0.25 : -10, t.z);
            o.scale.setScalar(borte ? 1 : 0.001);
            o.updateMatrix();
            st.setMatrixAt(i, o.matrix);
        });
        g.instanceMatrix.needsUpdate = true;
        st.instanceMatrix.needsUpdate = true;
    };

    useLayoutEffect(() => {
        skriv(radius.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        radius.current = forste.current ? hogst : damp(radius.current, hogst, 0.7, dt);
        forste.current = false;
        if (Math.abs(radius.current - hogst) < 0.05) radius.current = hogst;
        if (Math.abs(skrevet.current - radius.current) > 0.3 || (radius.current === hogst && skrevet.current !== hogst)) {
            skriv(radius.current);
        }
    });

    return (
        <>
            <instancedMesh ref={ref} args={[undefined, undefined, trær.length]} material={mat.skog}>
                <coneGeometry args={[1.5, 4.8, 6, 1]} />
            </instancedMesh>
            <instancedMesh ref={stubber} args={[undefined, undefined, trær.length]} material={mat.stubbe}>
                <cylinderGeometry args={[0.6, 0.7, 0.6, 5]} />
            </instancedMesh>
        </>
    );
}

/** En kullmile: en haug ved dekket av torv som ryker. */
function Kullmile({ vis, playing }: { vis: boolean; playing: boolean }) {
    const rok = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        const g = rok.current;
        if (!g) return;
        g.children.forEach((c, i) => {
            const f = (tid.current * 0.18 + i / 4) % 1;
            c.position.set(-f * 4, 3 + f * 8, -f * 3);
            c.scale.setScalar(0.5 + f * 1.8);
        });
    });
    if (!vis) return null;
    return (
        <group position={[30, 0, 25]}>
            <mesh material={mat.tak} position={[0, 0, 0]} scale={[1, 0.6, 1]}>
                <sphereGeometry args={[4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh material={mat.lys} position={[0, 0.6, 3.9]}>
                <sphereGeometry args={[0.45, 8, 6]} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} material={mat.ved} position={[6 + (i % 2) * 1.2, 0.4 + Math.floor(i / 2) * 0.7, 2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.35, 0.35, 3, 6]} />
                </mesh>
            ))}
            <group ref={rok}>
                {[0, 1, 2, 3].map((i) => (
                    <mesh key={i} material={mat.rok}>
                        <icosahedronGeometry args={[1, 1]} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

/** Ekvipasjene: hest og slede, i en lang rekke inn mot smeltehytta. */
const LASS = ['stein', 'sekk', 'ved', 'stein', 'sekk', 'ved'] as const;

function Sleder({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const bein = useRef<(THREE.Group | null)[]>([]);
    const tid = useRef(0);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        // Hver beat starter et fast sted på veien og kjører videre, så et hopp ser likt ut.
        const start = [0.02, 0.2, 0.44, 0.7][Math.min(beat, 3)];
        const s = start + Math.min(beatTid.current, 14) * 0.012;
        refs.current.forEach((g, i) => {
            if (!g) return;
            const u = THREE.MathUtils.clamp(s - i * 0.045, 0, 0.999);
            const p = VEI.getPointAt(u);
            const fram = VEI.getTangentAt(u);
            g.position.copy(p);
            g.rotation.y = Math.atan2(-fram.z, fram.x);
        });
        bein.current.forEach((b, i) => {
            if (b) b.rotation.z = playing ? Math.sin(tid.current * 7 + i) * 0.35 : 0;
        });
    });
    return (
        <>
            {LASS.map((lass, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        refs.current[i] = g;
                    }}
                >
                    {/* Hesten, med hodet mot +x */}
                    <mesh material={mat.hest} position={[2.2, 1.5, 0]}>
                        <boxGeometry args={[2, 0.9, 0.7]} />
                    </mesh>
                    <mesh material={mat.hest} position={[3.4, 2.1, 0]} rotation={[0, 0, -0.7]}>
                        <boxGeometry args={[1.2, 0.45, 0.4]} />
                    </mesh>
                    <group
                        ref={(b) => {
                            bein.current[i] = b;
                        }}
                        position={[2.2, 1.05, 0]}
                    >
                        <mesh material={mat.hest} position={[0.7, -0.5, 0]}>
                            <boxGeometry args={[0.22, 1, 0.6]} />
                        </mesh>
                        <mesh material={mat.hest} position={[-0.7, -0.5, 0]}>
                            <boxGeometry args={[0.22, 1, 0.6]} />
                        </mesh>
                    </group>
                    {/* Sleden og lasset */}
                    <mesh material={mat.tre} position={[-0.6, 0.35, 0]}>
                        <boxGeometry args={[3, 0.3, 1.3]} />
                    </mesh>
                    <mesh
                        material={lass === 'stein' ? mat.malm : lass === 'sekk' ? mat.sekk : mat.ved}
                        position={[-0.6, 0.95, 0]}
                    >
                        {lass === 'ved' ? (
                            <boxGeometry args={[2.6, 0.9, 1.1]} />
                        ) : (
                            <dodecahedronGeometry args={[0.75, 0]} />
                        )}
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Reinflokken: fire instanserte deler (kropp, hode, horn, bein). */
const REIN = Array.from({ length: 22 }, (_, i) => ({
    x: FLOKK.x + (frø(i + 300) - 0.5) * 26,
    z: FLOKK.z + (frø(i + 400) - 0.5) * 18,
    r: frø(i + 500) * 0.8 - 0.4 + Math.PI * 0.15,
    lys: frø(i + 600) > 0.7,
}));

function Reinflokk({ playing }: { playing: boolean }) {
    const kropp = useRef<THREE.InstancedMesh>(null);
    const hode = useRef<THREE.InstancedMesh>(null);
    const horn = useRef<THREE.InstancedMesh>(null);
    const bein = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    const o = useMemo(() => new THREE.Object3D(), []);
    const lokal = useMemo(() => new THREE.Object3D(), []);
    const farge = useMemo(() => new THREE.Color(), []);

    useLayoutEffect(() => {
        REIN.forEach((r, i) => {
            farge.set(r.lys ? '#e9e2d6' : '#8a7a68');
            kropp.current?.setColorAt(i, farge);
            hode.current?.setColorAt(i, farge);
        });
        if (kropp.current?.instanceColor) kropp.current.instanceColor.needsUpdate = true;
        if (hode.current?.instanceColor) hode.current.instanceColor.needsUpdate = true;
    }, [farge]);

    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        REIN.forEach((r, i) => {
            // Flokken vandrer sakte mot +x mens de beiter.
            const x = r.x + Math.sin(t * 0.08 + i) * 1.5 + t * 0.08;
            const z = r.z + Math.cos(t * 0.07 + i * 2) * 1.2;
            const beite = Math.sin(t * 0.6 + i * 1.7) > 0.3;
            o.position.set(x, 0, z);
            o.rotation.set(0, r.r, 0);
            o.updateMatrix();
            const sett = (
                mesh: THREE.InstancedMesh | null,
                p: [number, number, number],
                s: [number, number, number],
                rz = 0
            ) => {
                if (!mesh) return;
                lokal.position.set(...p);
                lokal.rotation.set(0, 0, rz);
                lokal.scale.set(...s);
                lokal.updateMatrix();
                lokal.matrix.premultiply(o.matrix);
                mesh.setMatrixAt(i, lokal.matrix);
            };
            sett(kropp.current, [0, 1.15, 0], [1.6, 0.7, 0.6]);
            sett(hode.current, beite ? [1.0, 0.75, 0] : [1.1, 1.6, 0], [0.6, 0.38, 0.32], beite ? 0.9 : -0.3);
            sett(horn.current, beite ? [1.05, 1.1, 0] : [1.05, 2.15, 0], [0.5, 0.6, 0.7], beite ? 0.9 : -0.2);
            sett(bein.current, [0, 0.45, 0], [1.3, 0.9, 0.42]);
        });
        [kropp, hode, horn, bein].forEach((m) => {
            if (m.current) m.current.instanceMatrix.needsUpdate = true;
        });
    });
    return (
        <>
            <instancedMesh ref={kropp} args={[undefined, undefined, REIN.length]} material={mat.reinlys}>
                <boxGeometry args={[1, 1, 1]} />
            </instancedMesh>
            <instancedMesh ref={hode} args={[undefined, undefined, REIN.length]} material={mat.reinlys}>
                <boxGeometry args={[1, 1, 1]} />
            </instancedMesh>
            <instancedMesh ref={horn} args={[undefined, undefined, REIN.length]} material={mat.horn}>
                <torusGeometry args={[0.5, 0.06, 4, 8, Math.PI]} />
            </instancedMesh>
            <instancedMesh ref={bein} args={[undefined, undefined, REIN.length]} material={mat.rein}>
                <boxGeometry args={[1, 1, 1]} />
            </instancedMesh>
        </>
    );
}

/** Lave, runde åser rundt vidda. */
function Aaser({ vinter }: { vinter: boolean }) {
    const aaser = [
        [-160, -120, 60],
        [40, -190, 80],
        [200, -60, 70],
        [-230, 60, 70],
        [180, 170, 60],
        [-60, 230, 70],
    ];
    return (
        <>
            {aaser.map(([x, z, r], i) => (
                <mesh key={i} position={[x, -r * 0.72, z]} scale={[1.4, 1, 1.2]}>
                    <sphereGeometry args={[r, 14, 8]} />
                    <meshStandardMaterial
                        color={vinter ? '#e6edf3' : '#7f8a66'}
                        emissive={vinter ? '#8495a8' : '#232a1a'}
                        emissiveIntensity={vinter ? 0.35 : 0.3}
                        flatShading
                    />
                </mesh>
            ))}
        </>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const vinter = modus === 'vinter' || modus === 'rein';
    const himmel = vinter ? '#a9b9cc' : '#c9d6dd';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 90, 380]} />
            <ambientLight intensity={vinter ? 0.8 : 0.7} color={vinter ? '#dfe7f2' : '#f1ede2'} />
            <directionalLight position={[-60, 80, 40]} intensity={vinter ? 0.9 : 1.3} color="#fff4e2" />
            <hemisphereLight args={[vinter ? '#dbe6f2' : '#e9efe6', '#4b5a48', 0.5]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[900, 900]} />
                <meshStandardMaterial
                    color={vinter ? '#eef3f7' : '#8d9670'}
                    emissive={vinter ? '#93a6ba' : '#2a2f1c'}
                    emissiveIntensity={vinter ? 0.32 : 0.35}
                    roughness={1}
                />
            </mesh>
            {modus === 'vinter' && (
                <mesh material={mat.is} rotation={[-Math.PI / 2, 0, 0]} position={[66, 0.03, 58]} scale={[1.6, 1, 1]}>
                    <circleGeometry args={[22, 28]} />
                </mesh>
            )}
            <Aaser vinter={vinter} />
            <Skog hogst={hogstFor(modus, beat)} />
            <Bergstaden vinter={vinter} />
            <Smeltehytta />
            <Royk playing={playing} mengde={modus === 'skog' && beat === 4 ? 1.6 : 1} />
            <Slagg stor={modus === 'skog' && beat >= 5} />
            <Gruvefjellet />
            {modus === 'vinter' && <Sleder beat={beat} playing={playing} />}
            {modus === 'skog' && <Kullmile vis={beat >= 1} playing={playing} />}
            {modus === 'skog' && beat === 3 && (
                <mesh material={mat.ring} rotation={[-Math.PI / 2, 0, 0]} position={[HYTTA.x, 0.15, HYTTA.z]}>
                    <ringGeometry args={[57, 59.5, 64]} />
                </mesh>
            )}
            {modus === 'rein' && <Reinflokk playing={playing} />}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    vinter: ['Rørosvidda, midtvinter', 'Hest og slede', 'Malm, trekull og ved', 'Bergstaden Røros'],
    gruve: [
        'Kobber: et rødbrunt metall',
        '1644: malm = stein med metall i',
        'Storwartz: den viktigste gruva',
        'Kongen i København',
        'Tyske eksperter',
    ],
    skog: [
        'Smeltehytta trenger ved',
        'Kullmile: ved som brennes sakte',
        'Skogen forsvinner',
        'Rundt 1670: hugget ut innen 25 km',
        'Røyk dag og natt',
        'Svart slagg',
    ],
    rein: [
        'Vidda var ikke tom',
        'Sørsamiske familier og reinen',
        'Kjøtt, bein, horn, skinn, reinost',
        'Kamp om skog og beite',
        'Fra 2018: tospråklig kommune',
    ],
};

export function RorosLandskap({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'vinter';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 900, position: [40, 20, 60] }}
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
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
