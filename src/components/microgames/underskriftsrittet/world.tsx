// Gråboksen: verden i primitive former. Hest = kalkhvit kloss, tun = ring med tre røde hus,
// lykter = gule lyspøler med ytre ring, dragoner = røde kjegler, åser = lave grønne kupler.
// Ingen kunst, ingen juice. Alt som beveger seg, leses fra spilltilstanden i useFrame.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Game } from './game';
import { utÅpen } from './game';
import { BRETT } from './levels';
import { dist } from './rules';
import { FARGE } from './palette';
import { TUNING } from './tuning';

const T = TUNING;
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];


type GRef = React.MutableRefObject<Game>;

/** Det som står stille i et brett: bakke, landevei, åser, tun og utgangen. */
export function Kart({ brett, gRef }: { brett: number; gRef: GRef }) {
    const b = BRETT[brett];
    const fyll = useRef<(THREE.Mesh | null)[]>([]);
    const segl = useRef<(THREE.Mesh | null)[]>([]);
    const ut = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = gRef.current;
        g.tun.forEach((t, i) => {
            const m = fyll.current[i];
            if (m) {
                const k = Math.max(0.001, t.samlet / T.tun.seglVed);
                m.scale.setScalar(k);
            }
            const s = segl.current[i];
            if (s) s.visible = t.segl;
        });
        if (ut.current) ut.current.visible = g.brett === brett && utÅpen(g);
    });
    return (
        <group>
            <mesh rotation={FLAT} position={[0, -0.02, 0]}>
                <planeGeometry args={[T.grense * 2 + 30, T.grense * 2 + 30]} />
                <meshLambertMaterial color={FARGE.grunn} />
            </mesh>
            {b.vei.slice(1).map((p, i) => {
                const a = b.vei[i];
                const l = dist(a[0], a[1], p[0], p[1]);
                return (
                    <mesh
                        key={i}
                        position={[(a[0] + p[0]) / 2, 0, (a[1] + p[1]) / 2]}
                        rotation={[-Math.PI / 2, 0, -Math.atan2(p[1] - a[1], p[0] - a[0])]}
                    >
                        <planeGeometry args={[l + T.hest.veiBredde, T.hest.veiBredde * 1.4]} />
                        <meshLambertMaterial color={FARGE.vei} />
                    </mesh>
                );
            })}
            {b.åser.map(([x, z, r], i) => (
                <mesh key={i} position={[x, 0, z]} scale={[1, 0.28, 1]}>
                    <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshLambertMaterial color={FARGE.skog} />
                </mesh>
            ))}
            {b.bygder.map((t, i) => (
                <group key={t.navn} position={[t.x, 0, t.z]}>
                    <mesh rotation={FLAT} position={[0, 0.03, 0]}>
                        <ringGeometry args={[T.tun.radius - 0.25, T.tun.radius, 48]} />
                        <meshBasicMaterial color={FARGE.kalk} />
                    </mesh>
                    <mesh
                        rotation={FLAT}
                        position={[0, 0.02, 0]}
                        ref={(m) => {
                            fyll.current[i] = m;
                        }}
                    >
                        <circleGeometry args={[T.tun.radius - 0.25, 48]} />
                        <meshBasicMaterial color={FARGE.kalk} transparent opacity={0.22} />
                    </mesh>
                    {[0, 1, 2].map((k) => {
                        const a = (k / 3) * Math.PI * 2 + 0.6;
                        return (
                            <mesh key={k} position={[Math.cos(a) * 2.6, 0.5, Math.sin(a) * 2.6]}>
                                <boxGeometry args={[1.4, 1, 1]} />
                                <meshLambertMaterial color={FARGE.blod} />
                            </mesh>
                        );
                    })}
                    <mesh
                        position={[0, 0.6, 0]}
                        visible={false}
                        ref={(m) => {
                            segl.current[i] = m;
                        }}
                    >
                        <cylinderGeometry args={[1.4, 1.4, 0.3, 24]} />
                        <meshBasicMaterial color={FARGE.blod} />
                    </mesh>
                </group>
            ))}
            <group ref={ut} position={[b.ut[0], 0, b.ut[1]]} visible={false}>
                <mesh rotation={FLAT} position={[0, 0.05, 0]}>
                    <ringGeometry args={[2.4, 3, 32]} />
                    <meshBasicMaterial color={FARGE.kalk} />
                </mesh>
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[0.3, 3, 0.3]} />
                    <meshBasicMaterial color={FARGE.kalk} />
                </mesh>
            </group>
        </group>
    );
}

/** Hesten og fangstringen rundt den. */
export function Hest({ gRef }: { gRef: GRef }) {
    const hest = useRef<THREE.Group>(null);
    const ring = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const g = gRef.current;
        const h = g.hest;
        if (hest.current) {
            hest.current.position.set(h.x, 0, h.z);
            hest.current.rotation.y = -h.retning;
        }
        if (ring.current) {
            ring.current.position.set(h.x, 0.08, h.z);
            ring.current.visible = g.fangst > 0.01;
            const m = ring.current.material as THREE.MeshBasicMaterial;
            m.opacity = 0.35 + 0.65 * g.fangst;
            ring.current.scale.setScalar(1.6 - 0.6 * g.fangst);
        }
    });
    return (
        <>
            <group ref={hest}>
                <mesh position={[0, 0.6, 0]}>
                    <boxGeometry args={[1.6, 0.8, 0.6]} />
                    <meshLambertMaterial color={FARGE.kalk} />
                </mesh>
                <mesh position={[0.95, 0.95, 0]}>
                    <boxGeometry args={[0.5, 0.5, 0.4]} />
                    <meshLambertMaterial color={FARGE.kalk} />
                </mesh>
                <mesh position={[0, 1.3, 0]}>
                    <boxGeometry args={[0.4, 0.7, 0.4]} />
                    <meshLambertMaterial color={FARGE.blekk} />
                </mesh>
            </group>
            <mesh ref={ring} rotation={FLAT} visible={false}>
                <ringGeometry args={[1.0, 1.35, 32]} />
                <meshBasicMaterial color={FARGE.gull} transparent opacity={0.5} />
            </mesh>
        </>
    );
}

/** Lyktene og dragonene: en fast pool som flyttes, aldri nye mesher under spillet. */
export function Lykter({ gRef }: { gRef: GRef }) {
    const pool = useRef<(THREE.Group | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        for (let i = 0; i < T.lykt.maks; i++) {
            const o = pool.current[i];
            if (!o) continue;
            const l = g.lykter[i];
            o.visible = !!l;
            if (!l) continue;
            o.position.set(l.x, 0, l.z);
            const r = l.dragon ? T.dragon.lys : T.lykt.lys;
            const [pøl, kant, kule, dragon] = o.children as THREE.Mesh[];
            pøl.scale.setScalar(r);
            kant.scale.setScalar(r);
            (pøl.material as THREE.MeshBasicMaterial).opacity = l.farlig ? 0.42 : 0.2;
            kule.visible = !l.dragon;
            dragon.visible = l.dragon;
            dragon.rotation.y = -l.retning;
        }
    });
    return (
        <>
            {Array.from({ length: T.lykt.maks }, (_, i) => (
                <group
                    key={i}
                    visible={false}
                    ref={(o) => {
                        pool.current[i] = o;
                    }}
                >
                    <mesh rotation={FLAT} position={[0, 0.06, 0]}>
                        <circleGeometry args={[1, 32]} />
                        <meshBasicMaterial color={FARGE.gull} transparent opacity={0.42} depthWrite={false} />
                    </mesh>
                    <mesh rotation={FLAT} position={[0, 0.07, 0]}>
                        <ringGeometry args={[0.94, 1, 40]} />
                        <meshBasicMaterial color={FARGE.gull} />
                    </mesh>
                    <mesh position={[0, 1.6, 0]}>
                        <sphereGeometry args={[0.3, 12, 8]} />
                        <meshBasicMaterial color={FARGE.gull} />
                    </mesh>
                    <mesh position={[0, 0.9, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.7, 1.8, 3]} />
                        <meshLambertMaterial color={FARGE.blod} />
                    </mesh>
                </group>
            ))}
        </>
    );
}
