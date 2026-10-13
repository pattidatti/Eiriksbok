import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Misjonsfilmens 3D-scener.
 * - `bordet`: stua i Lyngdal i 1844. Kvinnene rundt bordet, Gustava Kielland reiser seg,
 *   en pakke går ut av vinduet, og til slutt tennes lys i hus over hele bygda.
 * - `vekst`: foreningene som små hus. Ett i Lyngdal, så hundrevis, så 1700 for kvinner og
 *   830 for menn i 1882, og 3500 kvinneforeninger i 1904.
 * - `bedehus`: et bedehus reises i bygda, folk går inn, kirken og bedehuset knyttes sammen.
 */

type Modus = 'bordet' | 'vekst' | 'bedehus';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const KVINNE = '#ea580c';
const MANN = '#2563eb';

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'bordet') {
        switch (beat) {
            case 0:
                return { pos: v(14 - Math.min(t, 12) * 0.35, 9, 16), se: v(0, 1.5, 0) };
            case 1:
                return { pos: v(6.5 - Math.min(t, 10) * 0.15, 4.4, 6.5), se: v(0, 1.2, 0) };
            case 2:
                return { pos: v(1.6, 3.2, 4.2), se: v(-2.8, 2, 0) };
            case 3:
                return { pos: v(5.5, 3.6, 4.5), se: v(1.5, 2.4, -3.5) };
            default:
                return { pos: v(24 + Math.min(t, 12) * 0.4, 20, 32), se: v(0, 0, -4) };
        }
    }
    if (modus === 'vekst') {
        const bane = Math.min(t, 14) * 0.03;
        const avstand = [6, 15, 28, 58, 70, 72][Math.min(beat, 5)];
        const vinkel = 0.75 + bane;
        return {
            pos: v(Math.sin(vinkel) * avstand, avstand * 0.75 + 1.5, Math.cos(vinkel) * avstand),
            se: v(0, 0, 0),
        };
    }
    switch (beat) {
        case 0:
            return { pos: v(17 - Math.min(t, 10) * 0.3, 7, 19), se: v(0, 2, 0) };
        case 1:
            return { pos: v(10, 3.2, 13), se: v(1.5, 1.6, 2) };
        case 2:
            return { pos: v(-2, 17, 30), se: v(-10, 2, -6) };
        default: {
            const a = 0.4 + Math.min(t, 15) * 0.025;
            return { pos: v(Math.sin(a) * 50, 26, Math.cos(a) * 50), se: v(-4, 0, -4) };
        }
    }
}

/* ------------------------------------------------------------------ */
/* Felles småting                                                       */
/* ------------------------------------------------------------------ */

function Kvinne({
    pos,
    kjole,
    rot = 0,
    hode = '#e7c9a9',
}: {
    pos: [number, number, number];
    kjole: string;
    rot?: number;
    hode?: string;
}) {
    return (
        <group position={pos} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.65, 0]}>
                <cylinderGeometry args={[0.26, 0.52, 1.3, 10]} />
                <meshStandardMaterial color={kjole} flatShading />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
                <sphereGeometry args={[0.27, 14, 12]} />
                <meshStandardMaterial color={hode} />
            </mesh>
            {/* Skaut */}
            <mesh position={[0, 1.62, -0.03]} scale={[1.08, 0.9, 1.08]}>
                <sphereGeometry args={[0.28, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
        </group>
    );
}

function Hus({ pos, farge = '#b91c1c', skala = 1 }: { pos: [number, number, number]; farge?: string; skala?: number }) {
    return (
        <group position={pos} scale={skala}>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[3, 2, 2.2]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.5, 1, 1.1]}>
                <coneGeometry args={[1.6, 1.1, 4]} />
                <meshStandardMaterial color="#44403c" flatShading />
            </mesh>
        </group>
    );
}

function Aaser({ farge = '#4d7c3a' }: { farge?: string }) {
    const aaser = useMemo(
        () =>
            [
                [-60, -70, 30, 14],
                [-15, -85, 38, 18],
                [40, -75, 32, 15],
                [85, -40, 28, 12],
                [-90, -20, 26, 11],
            ] as const,
        []
    );
    return (
        <>
            {aaser.map(([x, z, r, h], i) => (
                <mesh key={i} position={[x, 0, z]} scale={[1, h / r, 1]}>
                    <sphereGeometry args={[r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={farge} flatShading />
                </mesh>
            ))}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Bordet i Lyngdal                                                     */
/* ------------------------------------------------------------------ */

const LANDSBY: [number, number][] = Array.from({ length: 36 }, (_, i) => {
    const a = i * 2.39996;
    const r = 16 + ((i * 37) % 50);
    return [Math.cos(a) * r, Math.sin(a) * r - 10];
});

function Bordet({ beat, tid }: { beat: number; tid: MutableRefObject<number> }) {
    const kielland = useRef<THREE.Group>(null);
    const pakke = useRef<THREE.Group>(null);
    const landsby = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        const t = tid.current;
        const k = kielland.current;
        if (k) {
            const opp = beat >= 2 ? 0.45 : 0;
            k.position.y = damp(k.position.y, opp, 3, dt || 1);
        }
        const p = pakke.current;
        if (p) {
            // Pakken løftes fra bordet, glir mot vinduet og forsvinner ut.
            const fra = v(0.4, 1.35, 0);
            const vindu = v(1.5, 2.5, -4);
            const ute = v(1.8, 4, -16);
            let mal = fra;
            let skala = 1;
            if (beat === 3) {
                const a = Math.min(1, Math.max(0, (t - 0.8) / 2.5));
                const b = Math.min(1, Math.max(0, (t - 3.3) / 2));
                mal = b > 0 ? vindu.clone().lerp(ute, b) : fra.clone().lerp(vindu, a);
                skala = 1 - b * 0.7;
            } else if (beat > 3) {
                skala = 0;
            }
            p.position.copy(mal);
            p.scale.setScalar(Math.max(0.001, skala));
            p.visible = skala > 0.01;
        }
        const l = landsby.current;
        if (l) {
            const s = damp(l.scale.y, beat >= 4 ? 1 : 0.001, 2, dt || 1);
            l.scale.set(1, s, 1);
            l.visible = s > 0.02;
        }
    });

    return (
        <>
            {/* Gulv og vegger */}
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[10, 0.1, 8]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            <mesh position={[0, 2.25, -4]}>
                <boxGeometry args={[10, 4.5, 0.2]} />
                <meshStandardMaterial color="#c08a4f" flatShading />
            </mesh>
            <mesh position={[-5, 2.25, 0]}>
                <boxGeometry args={[0.2, 4.5, 8]} />
                <meshStandardMaterial color="#b57d45" flatShading />
            </mesh>
            {/* Vinduet */}
            <mesh position={[1.5, 2.5, -3.88]}>
                <planeGeometry args={[1.8, 1.4]} />
                <meshStandardMaterial color="#1e3a8a" emissive="#3b5bab" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[1.5, 2.5, -3.86]}>
                <boxGeometry args={[1.9, 0.08, 0.04]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            <mesh position={[1.5, 2.5, -3.86]}>
                <boxGeometry args={[0.08, 1.5, 0.04]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            {/* Bordet */}
            <mesh position={[0, 1.1, 0]}>
                <boxGeometry args={[4.2, 0.12, 2.2]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0, 1.17, 0]}>
                <boxGeometry args={[3.9, 0.03, 1.9]} />
                <meshStandardMaterial color="#fafaf9" />
            </mesh>
            {[
                [-1.9, -0.9],
                [1.9, -0.9],
                [-1.9, 0.9],
                [1.9, 0.9],
            ].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.55, z]}>
                    <boxGeometry args={[0.14, 1.1, 0.14]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
            ))}
            {/* Stoff og garn på bordet */}
            {[
                [-1.2, 0.3, '#dc2626'],
                [-0.3, -0.4, '#2563eb'],
                [1.1, 0.4, '#16a34a'],
                [0.8, -0.5, '#f59e0b'],
            ].map(([x, z, c], i) => (
                <mesh key={i} position={[x as number, 1.2, z as number]} rotation={[0, i * 0.4, 0]}>
                    <boxGeometry args={[0.7, 0.03, 0.5]} />
                    <meshStandardMaterial color={c as string} />
                </mesh>
            ))}
            {[
                [-0.6, 0.55, '#7c3aed'],
                [0.2, 0.1, '#e11d48'],
                [1.5, -0.2, '#0891b2'],
            ].map(([x, z, c], i) => (
                <mesh key={i} position={[x as number, 1.32, z as number]}>
                    <sphereGeometry args={[0.14, 10, 8]} />
                    <meshStandardMaterial color={c as string} />
                </mesh>
            ))}
            {/* Kvinnene */}
            {[
                [-1.2, 1.55, '#1e3a8a', Math.PI],
                [0, 1.6, '#7c2d12', Math.PI],
                [1.2, 1.55, '#14532d', Math.PI],
                [-1.2, -1.55, '#831843', 0],
                [0, -1.6, '#334155', 0],
                [1.2, -1.55, '#92400e', 0],
                [2.8, 0, '#0f766e', -Math.PI / 2],
            ].map(([x, z, c, r], i) => (
                <Kvinne key={i} pos={[x as number, 0.15, z as number]} kjole={c as string} rot={r as number} />
            ))}
            <group ref={kielland} position={[0, 0, 0]}>
                <Kvinne pos={[-2.8, 0.15, 0]} kjole="#4c1d95" rot={Math.PI / 2} />
                {beat === 2 && (
                    <Html position={[-2.8, 2.6, 0]} center zIndexRange={[10, 0]}>
                        <div className="px-4 py-1.5 rounded-xl bg-white/95 text-slate-900 font-black text-2xl shadow-lg whitespace-nowrap select-none pointer-events-none">
                            Gustava Kielland
                        </div>
                    </Html>
                )}
            </group>
            {/* Pakken */}
            <group ref={pakke}>
                <mesh>
                    <boxGeometry args={[0.6, 0.35, 0.45]} />
                    <meshStandardMaterial color="#b45309" />
                </mesh>
                <mesh>
                    <boxGeometry args={[0.62, 0.37, 0.06]} />
                    <meshStandardMaterial color="#fef3c7" />
                </mesh>
            </group>
            {/* Lampa over bordet */}
            <mesh position={[0, 3.4, 0]}>
                <sphereGeometry args={[0.18, 12, 10]} />
                <meshBasicMaterial color="#fde68a" />
            </mesh>
            <pointLight position={[0, 3.2, 0.5]} intensity={12} distance={14} color="#ffd38a" />
            {/* Bygda ute i kveldsmørket */}
            <group ref={landsby} scale={[1, 0.001, 1]}>
                {LANDSBY.map(([x, z], i) => (
                    <group key={i} position={[x, 0, z]} rotation={[0, i, 0]}>
                        <Hus pos={[0, 0, 0]} farge={i % 3 === 0 ? '#f5f5f4' : '#991b1b'} skala={0.8} />
                        <mesh position={[0, 0.9, 0.9]}>
                            <boxGeometry args={[0.7, 0.55, 0.05]} />
                            <meshBasicMaterial color="#fcd34d" />
                        </mesh>
                    </group>
                ))}
            </group>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Foreningene som sprer seg                                            */
/* ------------------------------------------------------------------ */

const ANT_KVINNER = 3500;
const ANT_MENN = 830;
const KVINNE_PER_BEAT = [1, 4, 300, 1700, 3500, 3500];
const MENN_PER_BEAT = [0, 0, 0, 830, 0, 0];
/** De tre foreningene som fantes før Lyngdal (Christiania, Drammen, Trondheim). */
const FOR_LYNGDAL: [number, number][] = [
    [-4.5, -5.5],
    [6, -3],
    [2, 6.5],
];

function lagPlasser() {
    const S = 1.25;
    const pts: { x: number; z: number; d: number }[] = [];
    for (let i = -36; i <= 36; i++) {
        for (let j = -36; j <= 36; j++) {
            const h = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
            const jx = (h - Math.floor(h) - 0.5) * 0.5;
            const h2 = Math.sin(i * 39.346 + j * 11.135) * 24634.6345;
            const jz = (h2 - Math.floor(h2) - 0.5) * 0.5;
            const x = (i + jx) * S;
            const z = (j + jz) * S;
            pts.push({ x, z, d: Math.hypot(x, z) + (h2 - Math.floor(h2)) * 3 });
        }
    }
    pts.sort((a, b) => a.d - b.d);
    const nermest = (x: number, z: number) => {
        let best = 0;
        let bd = Infinity;
        pts.forEach((p, i) => {
            const dd = Math.hypot(p.x - x, p.z - z);
            if (dd < bd) {
                bd = dd;
                best = i;
            }
        });
        return best;
    };
    const spesielle = [0, ...FOR_LYNGDAL.map(([x, z]) => nermest(x, z))];
    const rest = pts.map((_, i) => i).filter((i) => !spesielle.includes(i));
    const kvinner: number[] = [...spesielle];
    const menn: number[] = [];
    rest.forEach((i, n) => {
        const h = Math.sin(n * 91.7) * 1000;
        const tilMann = menn.length < ANT_MENN && h - Math.floor(h) < 0.33;
        if (tilMann) menn.push(i);
        else if (kvinner.length < ANT_KVINNER) kvinner.push(i);
    });
    return { pts, kvinner, menn };
}

function Foreninger({ beat }: { beat: number }) {
    const { pts, kvinner, menn } = useMemo(() => lagPlasser(), []);
    const kropp = useRef<THREE.InstancedMesh>(null);
    const tak = useRef<THREE.InstancedMesh>(null);
    const antall = ANT_KVINNER + ANT_MENN;
    const nK = useRef(-1);
    const nM = useRef(-1);
    const sist = useRef('');
    const m = useMemo(() => new THREE.Matrix4(), []);
    const q = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), []);

    // Fargene settes én gang: kvinner oransje tak, menn blått.
    useEffect(() => {
        const t = tak.current;
        const k = kropp.current;
        if (!t || !k) return;
        const c = new THREE.Color();
        for (let i = 0; i < antall; i++) {
            c.set(i < ANT_KVINNER ? KVINNE : MANN);
            t.setColorAt(i, c);
            c.set('#fafaf9');
            k.setColorAt(i, c);
        }
        if (t.instanceColor) t.instanceColor.needsUpdate = true;
        if (k.instanceColor) k.instanceColor.needsUpdate = true;
    }, [antall]);

    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        const mk = KVINNE_PER_BEAT[Math.min(beat, 5)];
        const mm = MENN_PER_BEAT[Math.min(beat, 5)];
        if (nK.current < 0) {
            nK.current = mk;
            nM.current = mm;
        }
        // Lineær vekst med et tak på tre sekunder, uansett hvor mange som skal til.
        const steg = (fra: number, til: number) => {
            const fart = Math.max(1, Math.abs(til - fra)) / 2.5 + 40;
            if (Math.abs(til - fra) <= fart * dt) return til;
            return fra + Math.sign(til - fra) * Math.max(fart * dt, Math.abs(til - fra) * (1 - Math.exp(-1.6 * dt)));
        };
        nK.current = steg(nK.current, mk);
        nM.current = steg(nM.current, mm);
        const nokkel = `${Math.round(nK.current)}-${Math.round(nM.current)}`;
        if (nokkel === sist.current) return;
        sist.current = nokkel;
        const k = kropp.current;
        const t = tak.current;
        if (!k || !t) return;
        const sett = (idx: number, plass: number, s: number) => {
            const p = pts[plass];
            const stor = idx === 0 ? 1.8 : 1;
            const sk = Math.max(0.0001, s) * stor;
            m.compose(new THREE.Vector3(p.x, 0.22 * sk, p.z), q, new THREE.Vector3(sk, sk, sk));
            k.setMatrixAt(idx, m);
            m.compose(new THREE.Vector3(p.x, 0.62 * sk, p.z), q, new THREE.Vector3(sk, sk, sk));
            t.setMatrixAt(idx, m);
        };
        kvinner.forEach((plass, i) => sett(i, plass, Math.min(1, Math.max(0, nK.current - i))));
        menn.forEach((plass, i) => sett(ANT_KVINNER + i, plass, Math.min(1, Math.max(0, nM.current - i))));
        k.instanceMatrix.needsUpdate = true;
        t.instanceMatrix.needsUpdate = true;
    });

    const ringer = (beat === 0 ? [0] : beat === 1 ? [0, 1, 2, 3] : []).map((i) => pts[kvinner[i]]);
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <circleGeometry args={[140, 48]} />
                <meshStandardMaterial color="#6b9a4b" />
            </mesh>
            <instancedMesh ref={kropp} args={[undefined, undefined, antall]} frustumCulled={false}>
                <boxGeometry args={[0.62, 0.44, 0.62]} />
                <meshStandardMaterial flatShading />
            </instancedMesh>
            <instancedMesh ref={tak} args={[undefined, undefined, antall]} frustumCulled={false}>
                <coneGeometry args={[0.56, 0.38, 4]} />
                <meshStandardMaterial flatShading />
            </instancedMesh>
            {ringer.map((p, i) => (
                <mesh key={i} position={[p.x, 0.03, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[i === 0 ? 1.4 : 0.9, i === 0 ? 1.75 : 1.15, 32]} />
                    <meshBasicMaterial color={i === 0 ? '#facc15' : '#fb923c'} />
                </mesh>
            ))}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Bedehuset                                                            */
/* ------------------------------------------------------------------ */

const KIRKE: [number, number, number] = [-22, 0, -14];
const SMAA_BEDEHUS: [number, number][] = Array.from({ length: 14 }, (_, i) => {
    const a = -0.4 + i * 0.45;
    const r = 42 + (i % 3) * 14;
    return [Math.sin(a) * r * 1.2, -Math.cos(a) * r];
});
const FOLK = [
    { fra: [-7, 0, 11], kjole: '#1e3a8a' },
    { fra: [-9, 0, 9], kjole: '#7c2d12' },
    { fra: [-6, 0, 14], kjole: '#14532d' },
    { fra: [-11, 0, 12], kjole: '#831843' },
    { fra: [-8.5, 0, 15.5], kjole: '#334155' },
    { fra: [-12, 0, 15], kjole: '#92400e' },
] as const;
const DOR = v(0, 0, 2.6);

function Bedehuset({ beat, tid }: { beat: number; tid: MutableRefObject<number> }) {
    const hus = useRef<THREE.Group>(null);
    const smaa = useRef<THREE.Group>(null);
    const folk = useRef<(THREE.Group | null)[]>([]);
    const bue = useRef<THREE.Mesh>(null);

    const takGeo = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-2.4, 0);
        s.lineTo(2.4, 0);
        s.lineTo(0, 2);
        s.lineTo(-2.4, 0);
        const g = new THREE.ExtrudeGeometry(s, { depth: 7.2, bevelEnabled: false });
        g.translate(0, 0, -3.6);
        g.rotateY(Math.PI / 2);
        return g;
    }, []);
    const bueGeo = useMemo(() => {
        const kurve = new THREE.QuadraticBezierCurve3(v(KIRKE[0], 9.5, KIRKE[2]), v(-11, 16, -6), v(0, 5.5, 0));
        return new THREE.TubeGeometry(kurve, 60, 0.35, 8, false);
    }, []);
    useEffect(
        () => () => {
            takGeo.dispose();
            bueGeo.dispose();
        },
        [takGeo, bueGeo]
    );

    useFrame((_, dt) => {
        const t = tid.current;
        const h = hus.current;
        if (h) {
            const s = beat === 0 ? Math.min(1, 0.05 + t / 2.2) : 1;
            h.scale.set(1, Math.max(0.001, s), 1);
        }
        const sm = smaa.current;
        if (sm) {
            sm.children.forEach((c, i) => {
                const mal = beat === 0 ? (t > 1.5 + i * 0.25 ? 1 : 0.001) : 1;
                const ny = damp(c.scale.y, mal, 5, dt || 1);
                c.scale.set(1, Math.max(0.001, ny), 1);
            });
        }
        folk.current.forEach((g, i) => {
            if (!g) return;
            const fra = v(...(FOLK[i].fra as unknown as [number, number, number]));
            if (beat < 1) {
                g.position.copy(fra);
                g.visible = true;
                return;
            }
            // Folk går mot døra og forsvinner inn.
            const a = beat === 1 ? Math.min(1, Math.max(0, (t - i * 0.5) / 5)) : 1;
            g.position.copy(fra.clone().lerp(DOR, a));
            g.lookAt(DOR.x, 0, DOR.z);
            g.visible = a < 0.97;
        });
        const b = bue.current;
        if (b) {
            const idx = bueGeo.index?.count ?? 0;
            const del = beat === 2 ? Math.min(1, t / 2.5) : beat > 2 ? 1 : 0;
            const n = Math.floor((idx * del) / 48) * 48;
            bueGeo.setDrawRange(0, n);
            b.visible = n > 0;
        }
    });

    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <circleGeometry args={[160, 48]} />
                <meshStandardMaterial color="#79a85a" />
            </mesh>
            <Aaser />
            {/* Bedehuset */}
            <group ref={hus}>
                <mesh position={[0, 1.7, 0]}>
                    <boxGeometry args={[7, 3.4, 4.6]} />
                    <meshStandardMaterial color="#fafaf9" flatShading />
                </mesh>
                <mesh geometry={takGeo} position={[0, 3.4, 0]}>
                    <meshStandardMaterial color="#374151" flatShading />
                </mesh>
                <mesh position={[0, 1, 2.32]}>
                    <boxGeometry args={[1.1, 2, 0.06]} />
                    <meshStandardMaterial color="#7c2d12" />
                </mesh>
                {[-2.6, -1.4, 1.4, 2.6].map((x) => (
                    <mesh key={x} position={[x, 2, 2.32]}>
                        <boxGeometry args={[0.75, 1.2, 0.06]} />
                        <meshStandardMaterial color="#1e3a8a" emissive="#1e3a8a" emissiveIntensity={0.3} />
                    </mesh>
                ))}
                {beat === 2 && (
                    <Html position={[0, 7.2, 0]} center zIndexRange={[10, 0]}>
                        <div className="px-4 py-1.5 rounded-xl bg-white/95 text-teal-800 font-black text-2xl shadow-lg whitespace-nowrap select-none pointer-events-none">
                            Bedehuset
                        </div>
                    </Html>
                )}
            </group>
            {/* Kirken */}
            <group position={KIRKE}>
                <mesh position={[0, 2.2, 0]}>
                    <boxGeometry args={[5, 4.4, 9]} />
                    <meshStandardMaterial color="#f5f5f4" flatShading />
                </mesh>
                <mesh position={[0, 5.1, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.2, 1, 2.1]}>
                    <coneGeometry args={[2.6, 1.8, 4]} />
                    <meshStandardMaterial color="#7f1d1d" flatShading />
                </mesh>
                <mesh position={[0, 4, 5]}>
                    <boxGeometry args={[2, 8, 2]} />
                    <meshStandardMaterial color="#f5f5f4" flatShading />
                </mesh>
                <mesh position={[0, 9.5, 5]} rotation={[0, Math.PI / 4, 0]}>
                    <coneGeometry args={[1.5, 3, 4]} />
                    <meshStandardMaterial color="#7f1d1d" flatShading />
                </mesh>
                {beat === 2 && (
                    <Html position={[0, 13, 5]} center zIndexRange={[10, 0]}>
                        <div className="px-4 py-1.5 rounded-xl bg-white/95 text-slate-900 font-black text-2xl shadow-lg whitespace-nowrap select-none pointer-events-none">
                            Kirken
                        </div>
                    </Html>
                )}
            </group>
            <mesh ref={bue} geometry={bueGeo}>
                <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.4} />
            </mesh>
            {/* Gårder i bygda */}
            <Hus pos={[16, 0, -6]} />
            <Hus pos={[-12, 0, 12]} farge="#b45309" />
            <Hus pos={[24, 0, 8]} farge="#991b1b" />
            <Hus pos={[-30, 0, 6]} />
            {/* Folk på vei til møte */}
            {FOLK.map((f, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        folk.current[i] = g;
                    }}
                >
                    <Kvinne pos={[0, 0, 0]} kjole={f.kjole} />
                </group>
            ))}
            {/* Bedehus over hele landet: små hvite hus på åsene rundt */}
            <group ref={smaa}>
                {SMAA_BEDEHUS.map(([x, z], i) => (
                    <group key={i} position={[x, 0, z]} scale={[1, 0.001, 1]}>
                        <Hus pos={[0, 0, 0]} farge="#fafaf9" skala={1.3} />
                    </group>
                ))}
            </group>
        </>
    );
}

/* ------------------------------------------------------------------ */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrigeBeat = useRef(-1);
    const kamSe = useRef(new THREE.Vector3(0, 1, 0));
    const forste = useRef(true);

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrigeBeat.current) {
            forrigeBeat.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const mal = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mal.pos, k);
        kamSe.current.lerp(mal.se, k);
        camera.lookAt(kamSe.current);
    });

    const kveld = modus === 'bordet';
    return (
        <>
            <color attach="background" args={[kveld ? '#33456e' : '#bfe3ff']} />
            <fog attach="fog" args={[kveld ? '#33456e' : '#d4ecfb', kveld ? 40 : 90, kveld ? 140 : 260]} />
            <ambientLight intensity={kveld ? 0.55 : 0.65} color={kveld ? '#c7d2fe' : '#ffffff'} />
            <directionalLight position={[20, 40, 25]} intensity={kveld ? 0.5 : 1.5} color={kveld ? '#a5b4fc' : '#fff6e5'} />
            <hemisphereLight args={[kveld ? '#475f96' : '#dbeafe', kveld ? '#1f2937' : '#3f6212', 0.45]} />
            {modus === 'bordet' && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
                        <circleGeometry args={[150, 48]} />
                        <meshStandardMaterial color="#3f6b3a" emissive="#1a2e1a" emissiveIntensity={0.4} />
                    </mesh>
                    <Aaser farge="#2f4f2f" />
                    <Bordet beat={beat} tid={beatTid} />
                </>
            )}
            {modus === 'vekst' && <Foreninger beat={beat} />}
            {modus === 'bedehus' && <Bedehuset beat={beat} tid={beatTid} />}
        </>
    );
}

const TEKST: Record<Modus, (string | null)[]> = {
    bordet: [null, null, null, 'Til misjonærene, på den andre siden av jorda', 'Et forbilde for tusenvis'],
    vekst: ['Penger fra vanlige folk', null, 'Etter Lyngdal tar det fart', null, null, 'Norges første og største folkelige kvinnebevegelse'],
    bedehus: ['Bedehus over hele landet', 'Andakt og møter. Ikke en kirke.', null, 'Mange står fortsatt i dag'],
};

export function MisjonStua({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'bordet';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const tekst = TEKST[modus][Math.min(beat, TEKST[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 600, position: [14, 9, 16] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence>
                {tekst && (
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                )}
                {modus === 'vekst' && beat === 1 && (
                    <motion.div key="for" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-[4%] top-[20%] flex flex-col gap-3">
                        {['1839: Christiania', '1840: Drammen', '1843: Trondheim'].map((s, i) => (
                            <motion.div
                                key={s}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.6 }}
                                className="px-4 py-2 rounded-xl bg-white/95 shadow-lg text-2xl font-bold text-slate-900 border-l-[10px]"
                                style={{ borderColor: '#fb923c' }}
                            >
                                {s}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                {modus === 'vekst' && beat === 3 && (
                    <motion.div key="1882" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-[6%] left-1/2 -translate-x-1/2 flex gap-4 items-end">
                        <Merket farge={KVINNE}>
                            <Teller verdi={1700} etikett="for kvinner (1882)" />
                        </Merket>
                        <Merket farge={MANN}>
                            <Teller verdi={830} etikett="for menn (1882)" forsinkelse={0.8} />
                        </Merket>
                    </motion.div>
                )}
                {modus === 'vekst' && beat === 4 && (
                    <motion.div key="1904" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-[6%] left-1/2 -translate-x-1/2">
                        <Merket farge={KVINNE}>
                            <Teller verdi={3500} etikett="kvinneforeninger (1904)" />
                        </Merket>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Merket({ farge, children }: { farge: string; children: ReactNode }) {
    return (
        <div className="rounded-2xl border-b-[10px]" style={{ borderColor: farge }}>
            {children}
        </div>
    );
}
