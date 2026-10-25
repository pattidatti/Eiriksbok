import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, frø, useKamera, v, type KameraMål } from './felles3d';

/**
 * Vestfronten i 3D: et flatt, ødelagt landskap med to grøftesystemer rett overfor
 * hverandre, piggtråd og hull etter granater i Ingenmannsland mellom dem.
 * Modusene: morgen (åpningen), linjer (systemet ovenfra), natt (bombardementet, bare
 * lysglimt langt borte) og jul (julevåpenhvilen 1914).
 */

type Modus = 'morgen' | 'linjer' | 'natt' | 'jul';
type Seg = [number, number, number, number];

/** Vår frontlinje ligger på z = 0, fiendens på z = -14. Kameraet står på vår side (+z). */
const FIENDE_Z = -14;

/** Frontlinje i «firkantet sikksakk»: skytestillinger og svinger (traverser). */
function sikksakk(z0: number, ut: number, fra: number, til: number, bredde: number): Seg[] {
    const segs: Seg[] = [];
    let x = fra;
    let i = 0;
    while (x < til) {
        const z = z0 + (i % 2 ? ut : 0);
        segs.push([x, z, x + bredde, z]);
        const nz = z0 + ((i + 1) % 2 ? ut : 0);
        if (x + bredde < til) segs.push([x + bredde, z, x + bredde, nz]);
        x += bredde;
        i++;
    }
    return segs;
}

/** Støtte- og reservelinjen: lavere sagtann. */
function sagtann(z0: number, ut: number, fra: number, til: number, steg: number): Seg[] {
    const segs: Seg[] = [];
    for (let x = fra, i = 0; x < til; x += steg, i++) {
        segs.push([x, z0 + (i % 2 ? ut : 0), x + steg, z0 + ((i + 1) % 2 ? ut : 0)]);
    }
    return segs;
}

const FRONT = sikksakk(0, -1.4, -46, 46, 3);
const FIENDE = sikksakk(FIENDE_Z, 1.4, -46, 46, 3);
const STOTTE = sagtann(8, 1, -46, 46, 6);
const RESERVE = sagtann(16, 1, -46, 46, 8);
const KOMMUNIKASJON: Seg[] = [
    [-20, 0, -19, 4],
    [-19, 4, -21, 8],
    [-21, 8, -19.5, 12],
    [-19.5, 12, -20.5, 16],
    [18, 0, 19, 4],
    [19, 4, 17.5, 8],
    [17.5, 8, 19, 12],
    [19, 12, 18, 16],
];

const FARGER = {
    front: '#ef4444',
    stotte: '#f59e0b',
    reserve: '#14b8a6',
    kommunikasjon: '#3b82f6',
} as const;

/** Mange like bokser langs en linje, som én instans-mesh. `side` legger dem på begge sider. */
function Segmenter({
    segs,
    bredde,
    hoyde,
    y,
    materiale,
    side = 0,
}: {
    segs: Seg[];
    bredde: number;
    hoyde: number;
    y: number;
    materiale: THREE.Material;
    side?: number;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const deler = useMemo(() => {
        const ut: { x: number; z: number; len: number; ang: number }[] = [];
        for (const [x1, z1, x2, z2] of segs) {
            const dx = x2 - x1;
            const dz = z2 - z1;
            const len = Math.hypot(dx, dz);
            const ang = Math.atan2(-dz, dx);
            const cx = (x1 + x2) / 2;
            const cz = (z1 + z2) / 2;
            if (!side) {
                ut.push({ x: cx, z: cz, len: len + bredde * 0.6, ang });
            } else {
                const nx = -dz / len;
                const nz = dx / len;
                ut.push({ x: cx + nx * side, z: cz + nz * side, len: len + 0.6, ang });
                ut.push({ x: cx - nx * side, z: cz - nz * side, len: len + 0.6, ang });
            }
        }
        return ut;
    }, [segs, bredde, side]);
    useLayoutEffect(() => {
        const m = ref.current;
        if (!m) return;
        const t = new THREE.Object3D();
        deler.forEach((d, i) => {
            t.position.set(d.x, y, d.z);
            t.rotation.set(0, d.ang, 0);
            t.scale.set(d.len, 1, 1);
            t.updateMatrix();
            m.setMatrixAt(i, t.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    }, [deler, y]);
    return (
        <instancedMesh ref={ref} args={[undefined, materiale, deler.length]} frustumCulled={false}>
            <boxGeometry args={[1, hoyde, bredde]} />
        </instancedMesh>
    );
}

/** Hull etter granater: en jordvoll og vann i bunnen. */
function Kratere() {
    const voll = useRef<THREE.InstancedMesh>(null);
    const vann = useRef<THREE.InstancedMesh>(null);
    const liste = useMemo(() => {
        const ut: { x: number; z: number; r: number }[] = [];
        for (let i = 0; i < 90; i++) {
            ut.push({
                x: (frø(i) - 0.5) * 90,
                z: -1.9 - frø(i + 200) * 10.2,
                r: 0.5 + frø(i + 400) * 1.3,
            });
        }
        for (let i = 0; i < 40; i++) {
            const z = 2 + frø(i + 600) * 22;
            if (Math.abs(z - 8.5) < 1.6 || Math.abs(z - 16.5) < 1.6) continue;
            ut.push({ x: (frø(i + 700) - 0.5) * 90, z, r: 0.4 + frø(i + 800) * 0.9 });
        }
        for (let i = 0; i < 40; i++) {
            ut.push({
                x: (frø(i + 900) - 0.5) * 90,
                z: FIENDE_Z - 2 - frø(i + 1000) * 20,
                r: 0.4 + frø(i + 1100) * 1.1,
            });
        }
        return ut;
    }, []);
    useLayoutEffect(() => {
        const t = new THREE.Object3D();
        liste.forEach((k, i) => {
            t.position.set(k.x, 0.05, k.z);
            t.rotation.set(-Math.PI / 2, 0, 0);
            t.scale.set(k.r, k.r, k.r * 0.5);
            t.updateMatrix();
            voll.current?.setMatrixAt(i, t.matrix);
            t.position.set(k.x, 0.04, k.z);
            t.scale.set(k.r * 0.85, k.r * 0.85, 1);
            t.updateMatrix();
            vann.current?.setMatrixAt(i, t.matrix);
        });
        if (voll.current) voll.current.instanceMatrix.needsUpdate = true;
        if (vann.current) vann.current.instanceMatrix.needsUpdate = true;
    }, [liste]);
    return (
        <>
            <instancedMesh ref={voll} args={[undefined, undefined, liste.length]} frustumCulled={false}>
                <torusGeometry args={[1, 0.28, 4, 12]} />
                <meshStandardMaterial color="#7a6548" emissive="#3a2c1c" emissiveIntensity={0.35} flatShading />
            </instancedMesh>
            <instancedMesh ref={vann} args={[undefined, undefined, liste.length]} frustumCulled={false}>
                <circleGeometry args={[1, 12]} />
                <meshStandardMaterial color="#56606a" emissive="#2c343c" emissiveIntensity={0.5} roughness={0.3} />
            </instancedMesh>
        </>
    );
}

/** Piggtråd: to rader med stolper og tråd, med en åpning på midten. */
function Piggtrad() {
    const stolper = useRef<THREE.InstancedMesh>(null);
    const rader = [-3.2, -10.8];
    const pos = useMemo(() => {
        const ut: { x: number; z: number; tilt: number }[] = [];
        rader.forEach((z, r) => {
            for (let x = -45; x <= 45; x += 1.8) {
                if (Math.abs(x) < 4.5) continue;
                ut.push({ x, z: z + (frø(x * 3 + r) - 0.5) * 0.5, tilt: (frø(x + r * 9) - 0.5) * 0.5 });
            }
        });
        return ut;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useLayoutEffect(() => {
        const t = new THREE.Object3D();
        pos.forEach((p, i) => {
            t.position.set(p.x, 0.5, p.z);
            t.rotation.set(p.tilt, 0, p.tilt * 0.6);
            t.updateMatrix();
            stolper.current?.setMatrixAt(i, t.matrix);
        });
        if (stolper.current) stolper.current.instanceMatrix.needsUpdate = true;
    }, [pos]);
    return (
        <>
            <instancedMesh ref={stolper} args={[undefined, undefined, pos.length]} frustumCulled={false}>
                <cylinderGeometry args={[0.05, 0.06, 1, 4]} />
                <meshStandardMaterial color="#2f2a24" />
            </instancedMesh>
            {rader.flatMap((z) =>
                [-1, 1].flatMap((s) =>
                    [0.35, 0.75].map((y) => (
                        <mesh key={`${z}-${s}-${y}`} position={[s * 25, y, z]} rotation={[0, 0, y > 0.5 ? 0.004 : -0.004]}>
                            <boxGeometry args={[41, 0.03, 0.03]} />
                            <meshBasicMaterial color="#1f1d1a" />
                        </mesh>
                    ))
                )
            )}
        </>
    );
}

/** Døde trær: stammer uten blader, noen med en knekt grein. */
function Traer() {
    const traer = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => ({
                x: (frø(i + 50) - 0.5) * 70,
                z: [-6, -9, 5, 12, -22, -26, 21, -4, 24][i],
                h: 2.5 + frø(i + 60) * 3,
                tilt: (frø(i + 70) - 0.5) * 0.4,
            })),
        []
    );
    return (
        <>
            {traer.map((t, i) => (
                <group key={i} position={[t.x, 0, t.z]} rotation={[0, frø(i) * 6, t.tilt]}>
                    <mesh position={[0, t.h / 2, 0]}>
                        <cylinderGeometry args={[0.1, 0.22, t.h, 5]} />
                        <meshStandardMaterial color="#3d3226" flatShading />
                    </mesh>
                    <mesh position={[0.35, t.h * 0.7, 0]} rotation={[0, 0, -0.9]}>
                        <cylinderGeometry args={[0.04, 0.07, 1.1, 4]} />
                        <meshStandardMaterial color="#3d3226" />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Lysglimt fra kanonene langt borte og i Ingenmannsland. Ingen mennesker i nærheten. */
function Glimt({ playing, styrke }: { playing: boolean; styrke: number }) {
    const ANTALL = 10;
    const kuler = useRef<(THREE.Mesh | null)[]>([]);
    const lys = useRef<(THREE.PointLight | null)[]>([]);
    const klokke = useRef(0);
    const skjaer = useRef<THREE.Mesh>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        klokke.current += dt;
        if (skjaer.current) {
            const c = klokke.current;
            (skjaer.current.material as THREE.MeshBasicMaterial).opacity =
                (0.35 + 0.2 * Math.abs(Math.sin(c * 5.3) * Math.sin(c * 2.1))) * (0.5 + styrke * 0.5);
        }
        for (let i = 0; i < ANTALL; i++) {
            const periode = 1.6 + frø(i + 3) * 1.6;
            const tt = klokke.current + (i === 0 ? 0.25 : frø(i + 9) * periode);
            const n = Math.floor(tt / periode);
            const lokal = tt - n * periode;
            const x = (frø(n * 7 + i) - 0.5) * (i < 2 ? 20 : 70);
            const z = i % 2 ? -4 - frø(n * 13 + i) * 7 : FIENDE_Z - 6 - frø(n * 13 + i) * 28;
            const a = lokal < 0.9 ? 1 - lokal / 0.9 : 0;
            const k = kuler.current[i];
            if (k) {
                k.position.set(x, 0.4 + lokal * 1.2, z);
                k.scale.setScalar(a > 0 ? 0.3 + lokal * 1.1 : 0.001);
                (k.material as THREE.MeshBasicMaterial).opacity = a * 0.75 * styrke;
            }
            const l = lys.current[i];
            if (l) {
                l.position.set(x, 2, z);
                l.intensity = a * 60 * styrke;
            }
        }
    });
    return (
        <>
            {/* Ildskjæret langs horisonten der kanonene skyter */}
            <mesh ref={skjaer} position={[0, 4, -75]}>
                <planeGeometry args={[320, 14]} />
                <meshBasicMaterial color="#ff7a2e" transparent opacity={0.4} depthWrite={false} fog={false} />
            </mesh>
            {Array.from({ length: ANTALL }, (_, i) => (
                <group key={i}>
                    <mesh ref={(m) => void (kuler.current[i] = m)}>
                        <sphereGeometry args={[1, 10, 8]} />
                        <meshBasicMaterial color="#ffb347" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
                    </mesh>
                    <pointLight ref={(l) => void (lys.current[i] = l)} color="#ff9a3d" intensity={0} distance={40} decay={1.4} />
                </group>
            ))}
        </>
    );
}

/** En soldat i julevåpenhvilen: kropp, hode og hjelm. Glir mot målet for beaten. */
function Soldat({
    hjem,
    ute,
    farge,
    britisk,
    utePå,
    playing,
}: {
    hjem: THREE.Vector3;
    ute: THREE.Vector3;
    farge: string;
    britisk: boolean;
    utePå: boolean;
    playing: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const mål = utePå ? ute : hjem;
        if (forste.current) {
            g.position.copy(mål);
            forste.current = false;
            return;
        }
        g.position.x = damp(g.position.x, mål.x, 0.9, dt);
        g.position.z = damp(g.position.z, mål.z, 0.9, dt);
        g.position.y = damp(g.position.y, mål.y, 2.5, dt);
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.2, 0.24, 1.1, 7]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.27, 0]}>
                <sphereGeometry args={[0.16, 8, 6]} />
                <meshStandardMaterial color="#e2b896" />
            </mesh>
            {britisk ? (
                <mesh position={[0, 1.4, 0]}>
                    <cylinderGeometry args={[0.28, 0.3, 0.05, 10]} />
                    <meshStandardMaterial color="#5b5a3c" />
                </mesh>
            ) : (
                <mesh position={[0, 1.36, 0]}>
                    <sphereGeometry args={[0.19, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#4d5348" />
                </mesh>
            )}
        </group>
    );
}

function Jul({ beat, playing }: { beat: number; playing: boolean }) {
    const ute = beat === 1 || beat === 2;
    const ball = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
        const b = ball.current;
        if (!b) return;
        const t = tid.current;
        b.visible = beat === 2;
        b.position.set(1.6 + Math.sin(t * 1.4) * 1, 1.7 + Math.abs(Math.sin(t * 2.8)) * 0.7, -7);
    });
    const soldater = useMemo(
        () =>
            Array.from({ length: 6 }, (_, i) => {
                const x = -7.5 + i * 3;
                return {
                    x,
                    britHjem: v(x, -1.8, 0.6),
                    britUte: v(x * 0.55 + (frø(i) - 0.5), 0, -5.6 - frø(i + 4) * 0.8),
                    tyskHjem: v(x + 1, -1.8, FIENDE_Z - 0.6),
                    tyskUte: v(x * 0.55 + 0.6 + (frø(i + 8) - 0.5), 0, -8.4 + frø(i + 12) * 0.8),
                };
            }),
        []
    );
    return (
        <>
            {soldater.map((s, i) => (
                <group key={i}>
                    <Soldat hjem={s.britHjem} ute={s.britUte} farge="#7d7346" britisk utePå={ute} playing={playing} />
                    <Soldat hjem={s.tyskHjem} ute={s.tyskUte} farge="#6e7468" britisk={false} utePå={ute} playing={playing} />
                </group>
            ))}
            <mesh ref={ball} visible={false}>
                <sphereGeometry args={[0.22, 12, 10]} />
                <meshStandardMaterial color="#ffffff" emissive="#d6d0c0" emissiveIntensity={0.8} />
            </mesh>
            {beat === 2 &&
                [
                    [-1.2, '#b91c1c'],
                    [0.6, '#15803d'],
                    [1.8, '#b91c1c'],
                ].map(([x, c]) => (
                    <mesh key={x as number} position={[x as number, 0.15, -6.6]}>
                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                        <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={0.3} />
                    </mesh>
                ))}
            {/* Lykter på brystvernet hos begge sider */}
            {[-9, -3, 3, 9].flatMap((x) => [
                <mesh key={`b${x}`} position={[x, 0.9, -0.9]}>
                    <boxGeometry args={[0.18, 0.28, 0.18]} />
                    <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={2} />
                </mesh>,
                <mesh key={`t${x}`} position={[x + 1, 0.9, FIENDE_Z + 0.9]}>
                    <boxGeometry args={[0.18, 0.28, 0.18]} />
                    <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={2} />
                </mesh>,
            ])}
            <pointLight position={[0, 3, -1]} color="#ffb347" intensity={18} distance={18} decay={1.4} />
            <pointLight position={[0, 3, FIENDE_Z + 1]} color="#ffb347" intensity={18} distance={18} decay={1.4} />
        </>
    );
}

const KAMERA: Record<Modus, KameraMål> = {
    morgen: (beat, t) => {
        switch (beat) {
            case 0:
                return { pos: v(7 - t * 0.25, 2.6, 4.5), se: v(-2, 0.2, -20) };
            case 1:
                return { pos: v(2.5, 2.1, 1.2 - t * 0.05), se: v(0, 0.3, -10) };
            case 2:
                return { pos: v(-2 - t * 0.2, 2.6, -1.2), se: v(-9, 0, -8) };
            default:
                return { pos: v(16, 13 + t * 0.2, 18), se: v(0, 0, -6) };
        }
    },
    linjer: (beat, t) => {
        switch (beat) {
            case 0:
                return { pos: v(0 + t * 0.2, 22, 22), se: v(0, 0, -2) };
            case 1:
                return { pos: v(2, 25, 30), se: v(0, 0, 4) };
            case 2:
                return { pos: v(4, 30, 38), se: v(0, 0, 8) };
            case 3:
                return { pos: v(-14, 28, 32), se: v(-6, 0, 8) };
            case 4:
                return { pos: v(26, 12, -4 + t * 0.1), se: v(0, 0, -7) };
            default:
                return { pos: v(5 - t * 0.15, 2.4, -1.4), se: v(-4, 0.5, -12) };
        }
    },
    natt: (beat, t) => {
        switch (beat) {
            case 0:
                return { pos: v(8, 2.2, 6), se: v(0, 0.5, -24) };
            case 1:
                return { pos: v(6, 1.8, 4), se: v(0, 0.8, -22) };
            case 2:
                // Lavt bak sandsekkene: bare brystvernet og glimtene foran.
                return { pos: v(-3, 1.35, 2.6), se: v(-1, 1.1, -30) };
            case 3:
                return { pos: v(-9, 4, 10), se: v(0, 0, -12) };
            case 4:
                return { pos: v(13, 2.6, 2), se: v(0, 0.5, -18) };
            default:
                return { pos: v(0, 10 + t * 0.4, 20 + t * 0.3), se: v(0, 0, -10) };
        }
    },
    jul: (beat, t) => {
        switch (beat) {
            case 0:
                return { pos: v(10, 5, 10), se: v(0, 0, -7) };
            case 1:
                return { pos: v(12, 3, 3 - t * 0.1), se: v(0, 0.6, -7) };
            case 2:
                return { pos: v(5, 1.9, -2.2), se: v(0, 0.7, -7) };
            case 3:
                return { pos: v(0, 26, -2), se: v(0, 0, -7.5) };
            default:
                return { pos: v(-12, 9 + t * 0.2, 16), se: v(0, 0, -7) };
        }
    },
};

const STEMNING: Record<Modus, { bg: string; tåke: [string, number, number]; lys: number; hemi: [string, string] }> = {
    morgen: { bg: '#b9b2a4', tåke: ['#b3ab9c', 14, 85], lys: 0.9, hemi: ['#d8d2c4', '#4a3f30'] },
    linjer: { bg: '#c7c1b3', tåke: ['#c9c3b5', 45, 150], lys: 1.1, hemi: ['#e2dccd', '#4a3f30'] },
    natt: { bg: '#161d2e', tåke: ['#1d2538', 30, 120], lys: 0.5, hemi: ['#4a5878', '#1a1712'] },
    jul: { bg: '#4b5876', tåke: ['#55617d', 25, 100], lys: 0.55, hemi: ['#8d9cc0', '#2a241c'] },
};

function Scene({ beat, playing, modus }: { beat: number; playing: boolean; modus: Modus }) {
    useKamera(KAMERA[modus], beat, playing, modus === 'natt' && beat <= 2 ? (beat === 2 ? 1.4 : 1) : 0);
    const st = STEMNING[modus];

    const materialer = useMemo(() => {
        const gulv = (farge: string) =>
            new THREE.MeshBasicMaterial({ color: farge, transparent: true, opacity: 0, depthWrite: false });
        return {
            front: gulv(FARGER.front),
            stotte: gulv(FARGER.stotte),
            reserve: gulv(FARGER.reserve),
            kommunikasjon: gulv(FARGER.kommunikasjon),
            grøft: new THREE.MeshStandardMaterial({ color: '#3a2a1b' }),
            fiende: new THREE.MeshStandardMaterial({ color: '#33271b' }),
            sekker: new THREE.MeshStandardMaterial({ color: '#a8946a', emissive: '#4a3e2a', emissiveIntensity: 0.3, flatShading: true }),
            tyskeSekker: new THREE.MeshStandardMaterial({ color: '#8f8a78', emissive: '#3e3b30', emissiveIntensity: 0.3, flatShading: true }),
        };
    }, []);

    // Linjene lyser opp én etter én i «linjer»; de som er vist, blir liggende svakere.
    useFrame((_, rawDt) => {
        // På pause hopper lyset rett til målet, så et stillbilde alltid er riktig.
        const dt = playing ? Math.min(rawDt, 0.05) : 1;
        const nivå = (fra: number) => (modus !== 'linjer' || beat < fra ? 0 : beat === fra ? 0.95 : 0.5);
        const sett = (m: THREE.MeshBasicMaterial, mål: number) => {
            m.opacity = damp(m.opacity, mål, 3, dt);
            m.visible = m.opacity > 0.01;
        };
        sett(materialer.front, nivå(0));
        sett(materialer.stotte, nivå(1));
        sett(materialer.reserve, nivå(2));
        sett(materialer.kommunikasjon, nivå(3));
    });

    return (
        <>
            <color attach="background" args={[st.bg]} />
            <fog attach="fog" args={st.tåke} />
            <ambientLight intensity={st.lys * 0.6} />
            <hemisphereLight args={[st.hemi[0], st.hemi[1], st.lys]} />
            <directionalLight position={[-20, 30, 15]} intensity={st.lys * 0.8} color="#f2ead8" />
            {/* Gjørma */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[320, 320]} />
                <meshStandardMaterial color="#6e5c45" emissive="#2e2418" emissiveIntensity={0.4} />
            </mesh>
            <Segmenter segs={FRONT} bredde={1.6} hoyde={0.1} y={0.03} materiale={materialer.grøft} />
            <Segmenter segs={STOTTE} bredde={1.3} hoyde={0.1} y={0.03} materiale={materialer.grøft} />
            <Segmenter segs={RESERVE} bredde={1.3} hoyde={0.1} y={0.03} materiale={materialer.grøft} />
            <Segmenter segs={KOMMUNIKASJON} bredde={1.1} hoyde={0.1} y={0.03} materiale={materialer.grøft} />
            {/* Fargebånd over linjene i «linjer», så de synes ovenfra */}
            <Segmenter segs={FRONT} bredde={1.2} hoyde={0.05} y={0.82} materiale={materialer.front} />
            <Segmenter segs={STOTTE} bredde={1.1} hoyde={0.05} y={0.56} materiale={materialer.stotte} />
            <Segmenter segs={RESERVE} bredde={1.1} hoyde={0.05} y={0.56} materiale={materialer.reserve} />
            <Segmenter segs={KOMMUNIKASJON} bredde={1.1} hoyde={0.05} y={0.2} materiale={materialer.kommunikasjon} />
            <Segmenter segs={FIENDE} bredde={1.6} hoyde={0.1} y={0.03} materiale={materialer.fiende} />
            <Segmenter segs={FRONT} bredde={0.7} hoyde={0.75} y={0.37} side={1.15} materiale={materialer.sekker} />
            <Segmenter segs={STOTTE} bredde={0.55} hoyde={0.5} y={0.25} side={0.95} materiale={materialer.sekker} />
            <Segmenter segs={RESERVE} bredde={0.55} hoyde={0.5} y={0.25} side={0.95} materiale={materialer.sekker} />
            <Segmenter segs={FIENDE} bredde={0.7} hoyde={0.75} y={0.37} side={1.15} materiale={materialer.tyskeSekker} />
            <Kratere />
            <Piggtrad />
            <Traer />
            {modus === 'linjer' && beat >= 4 && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, -7]}>
                    <planeGeometry args={[92, 10.6]} />
                    <meshBasicMaterial color="#fecaca" transparent opacity={0.22} depthWrite={false} />
                </mesh>
            )}
            {modus === 'natt' && <Glimt playing={playing} styrke={beat <= 2 ? 1 : 0.55} />}
            {modus === 'jul' && <Jul beat={beat} playing={playing} />}
        </>
    );
}

const LAPPER: Record<Modus, (string | null)[]> = {
    morgen: ['Flandern, tidlig morgen', 'Våt jord, gass, uvaskede kropper', 'Gjørme, hull og piggtråd', 'Vestfronten: fire år'],
    linjer: ['Frontlinjen', 'Støttelinjen', 'Reservelinjen', 'Kommunikasjonsgraver', 'Ingenmannsland', 'Hull, gjørme og piggtråd'],
    natt: ['Somme og Verdun', 'Dagevis uten stans', 'Ingen vei ut', null, null, null],
    jul: ['Julen 1914', 'Opp av grøftene', 'Gaver og fotball', 'Generalene: Aldri igjen', 'Ønsket om å overleve'],
};

const FORKLARING = [
    { navn: 'Frontlinjen', farge: FARGER.front, fra: 0 },
    { navn: 'Støttelinjen', farge: FARGER.stotte, fra: 1 },
    { navn: 'Reservelinjen', farge: FARGER.reserve, fra: 2 },
    { navn: 'Kommunikasjonsgraver', farge: FARGER.kommunikasjon, fra: 3 },
    { navn: 'Ingenmannsland', farge: '#fca5a5', fra: 4 },
    { navn: 'Fiendens grøfter', farge: '#8f8a78', fra: 4 },
];

const SYMPTOMER = ['Skjelver', 'Mister talen', 'Blind uten skade'];

export function SkyttergravFront({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'morgen';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.2, far: 400, position: [10, 6, 10] }}
            >
                <Scene beat={beat} playing={playing} modus={modus} />
            </Canvas>
            <AnimatePresence mode="wait">
                {lapp && (
                    <motion.div
                        key={lapp}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[7%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {lapp}
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'linjer' && (
                <div className="absolute bottom-[6%] left-[4%] flex flex-col gap-2">
                    {FORKLARING.map((f) => (
                        <motion.div
                            key={f.navn}
                            initial={false}
                            animate={{ opacity: beat >= f.fra && beat < 5 ? 1 : 0, x: beat >= f.fra ? 0 : -16 }}
                            className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/90 shadow-lg text-lg font-bold text-slate-800"
                        >
                            <span className="inline-block rounded-sm" style={{ width: 22, height: 12, background: f.farge }} />
                            {f.navn}
                        </motion.div>
                    ))}
                </div>
            )}
            {modus === 'natt' && (
                <AnimatePresence mode="wait">
                    {beat === 3 && (
                        <motion.div
                            key="symptomer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-[8%] left-1/2 -translate-x-1/2 flex gap-4"
                        >
                            {SYMPTOMER.map((s, i) => (
                                <motion.div
                                    key={s}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + i * 1.1 }}
                                    className="px-5 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-2xl md:text-3xl shadow-xl whitespace-nowrap"
                                >
                                    {s}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                    {beat === 4 && (
                        <motion.div
                            key="feig"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                        >
                            <div className="px-6 py-2.5 rounded-2xl bg-white/90 text-slate-900 font-black text-3xl md:text-4xl shadow-xl whitespace-nowrap">
                                Kalt feiginger
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2 }}
                                className="px-5 py-2 rounded-xl bg-red-700 text-white font-black text-2xl shadow-xl whitespace-nowrap"
                            >
                                Krigsrett
                            </motion.div>
                        </motion.div>
                    )}
                    {beat >= 5 && (
                        <motion.div
                            key="ptsd"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-[8%] left-1/2 -translate-x-1/2 flex items-center gap-5 px-8 py-4 rounded-3xl bg-white/95 shadow-2xl whitespace-nowrap"
                        >
                            <span className="text-3xl md:text-5xl font-black text-slate-900">Granatsjokk</span>
                            <span className="text-3xl md:text-5xl font-black text-slate-400">=</span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.2 }}
                                className="text-3xl md:text-5xl font-black text-teal-700"
                            >
                                PTSD
                            </motion.span>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
