// Landskapet i et brett: lyset (måneskinn, morgen, mars), kistelokket som bakke, landeveien,
// åsene, de rosemalte trærne, fogdgårdene der mennene kommer fra, og stolpen ved utgangen.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas, useQuality } from '../kit';
import type { Game } from './game';
import { utÅpen } from './game';
import { BRETT } from './levels';
import { dist, påVei } from './rules';
import { FARGE } from './palette';
import { TUNING } from './tuning';
import type { Scene } from './scene';
import { LAND_M, landTekstur, TITTEL_FONT, TEKST_FONT } from './textures';
import { iBildet, kull } from './synlig';
import { fogdGård, TRE_KRONE, TRE_STAMME } from './models';
import { konturMat, maltMat } from './kontur';

const T = TUNING;
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];
type GRef = React.MutableRefObject<Game>;
type SRef = React.MutableRefObject<Scene>;

const C_A = new THREE.Color();
const C_B = new THREE.Color();
// Natt, morgen (kommisjonen satt ned) og mars (kaldt, nesten bare grunnfarge).
const HIMMEL = ['#9db8d8', '#d8e4f0', '#8b9cab'];
const MÅNE = ['#c9dcff', '#fff1d8', '#aab8c8'];
const STYRKE = [1.7, 2.3, 1.1];

/** Måneskinn ovenfra-venstre, et kjølig himmellys og et svakt varmt lys fra bakken. */
export function Lys({ sRef }: { sRef: SRef }) {
    const hemi = useRef<THREE.HemisphereLight>(null);
    const måne = useRef<THREE.DirectionalLight>(null);
    const nå = useRef(0);
    useFrame((_, dt) => {
        const mål = sRef.current.lys;
        nå.current += (mål - nå.current) * Math.min(1, dt * 1.2);
        const v = nå.current;
        const i = Math.min(1, Math.floor(v));
        const k = v - i;
        if (hemi.current) {
            C_A.set(HIMMEL[i]);
            C_B.set(HIMMEL[Math.min(2, i + 1)]);
            hemi.current.color.copy(C_A.lerp(C_B, k));
        }
        if (måne.current) {
            C_A.set(MÅNE[i]);
            C_B.set(MÅNE[Math.min(2, i + 1)]);
            måne.current.color.copy(C_A.lerp(C_B, k));
            måne.current.intensity = STYRKE[i] + (STYRKE[Math.min(2, i + 1)] - STYRKE[i]) * k;
        }
    });
    return (
        <>
            <hemisphereLight ref={hemi} args={[HIMMEL[0], '#3a5e4e', 1.5]} />
            <directionalLight
                ref={måne}
                position={[-14, 24, -6]}
                intensity={STYRKE[0]}
                color={MÅNE[0]}
            />
            <ambientLight intensity={0.5} color="#bcd2e6" />
        </>
    );
}

/** Bakken (eng, lyng og åker), landeveien og lyngåsene. Ren kulisse for scene-auditen. */
export function Bakke({ brett }: { brett: number }) {
    const b = BRETT[brett];
    const telemark = b.bygder.some((t) => t.telemark);
    const S = LAND_M;
    // Lerretet males én gang per brett og gjenbrukes (ikke kastet ved brettbytte).
    const tex = useMemo(() => landTekstur(brett), [brett]);
    const åsMat = useMemo(() => new THREE.MeshToonMaterial({ color: FARGE.ås }), []);
    const åsKant = useMemo(() => konturMat(FARGE.blekk, 0.12), []);
    const steinMat = useMemo(() => maltMat({ vertexColors: false, color: '#9a968a' }), []);
    // Furu på lyngbergene, som på Agder-heiene: alle trærne i brettet i tre instanser.
    const furu = useMemo(() => {
        const r = frø(77 + brett * 13);
        const ut: { x: number; y: number; z: number; s: number }[] = [];
        for (const [ax, az, ar] of b.åser) {
            const n = Math.round(ar * 1.2);
            for (let k = 0; k < n; k++) {
                const a = (k / n) * Math.PI * 2 + r() * 0.8;
                const ρ = ar * (0.15 + r() * 0.6);
                const y = ÅS_Y * Math.sqrt(Math.max(0, ar * ar - ρ * ρ)) - 0.15;
                ut.push({ x: ax + Math.cos(a) * ρ, y, z: az + Math.sin(a) * ρ, s: 0.8 + r() * 0.5 });
            }
        }
        return ut;
    }, [b, brett]);
    const furuKrone = useRef<THREE.InstancedMesh>(null);
    const furuKant = useRef<THREE.InstancedMesh>(null);
    const furuStamme = useRef<THREE.InstancedMesh>(null);
    const furuMat = useMemo(() => new THREE.MeshToonMaterial({ color: FARGE.skog }), []);
    const furuKantMat = useMemo(() => konturMat(FARGE.blekk, 0.1), []);
    const furuStammeMat = useMemo(() => maltMat({ vertexColors: false, color: '#8a4a2a' }), []);
    useEffect(() => {
        furu.forEach((f, i) => {
            V.set(f.x, f.y + 1.3 * f.s, f.z);
            Q.identity();
            SK.set(f.s, f.s, f.s);
            M4.compose(V, Q, SK);
            furuKrone.current?.setMatrixAt(i, M4);
            furuKant.current?.setMatrixAt(i, M4);
            V.set(f.x, f.y, f.z);
            M4.compose(V, Q, SK);
            furuStamme.current?.setMatrixAt(i, M4);
        });
        for (const m of [furuKrone.current, furuKant.current, furuStamme.current]) {
            if (!m) continue;
            m.instanceMatrix.needsUpdate = true;
            m.computeBoundingSphere();
        }
    }, [furu]);
    return (
        <group userData={{ sceneAuditIgnore: true }}>
            <mesh rotation={FLAT} position={[0, -0.02, 0]}>
                <planeGeometry args={[S, S]} />
                <meshLambertMaterial map={tex} color={telemark ? '#dfe2ee' : '#ffffff'} />
            </mesh>
            {b.vei.slice(1).map((p, i) => {
                const a = b.vei[i];
                const l = dist(a[0], a[1], p[0], p[1]);
                const rot: [number, number, number] = [
                    -Math.PI / 2,
                    0,
                    -Math.atan2(p[1] - a[1], p[0] - a[0]),
                ];
                const pos: [number, number, number] = [(a[0] + p[0]) / 2, 0, (a[1] + p[1]) / 2];
                return (
                    <group key={i} position={pos} rotation={rot}>
                        <mesh position={[0, 0, 0.005]}>
                            <planeGeometry
                                args={[l + T.hest.veiBredde * 1.6, T.hest.veiBredde * 1.75]}
                            />
                            <meshLambertMaterial color={FARGE.veiKant} />
                        </mesh>
                        <mesh position={[0, 0, 0.01]}>
                            <planeGeometry
                                args={[l + T.hest.veiBredde * 1.3, T.hest.veiBredde * 1.3]}
                            />
                            <meshLambertMaterial color={FARGE.vei} />
                        </mesh>
                    </group>
                );
            })}
            {/* Runde ledd der veistykkene møtes, så veien går i ett (ikke som planker) */}
            {b.vei.map(([x, z], i) => (
                <group key={`l${i}`} position={[x, 0, z]}>
                    <mesh rotation={FLAT} position={[0, 0.006, 0]}>
                        <circleGeometry args={[T.hest.veiBredde * 0.875, 20]} />
                        <meshLambertMaterial color={FARGE.veiKant} />
                    </mesh>
                    <mesh rotation={FLAT} position={[0, 0.011, 0]}>
                        <circleGeometry args={[T.hest.veiBredde * 0.65, 20]} />
                        <meshLambertMaterial color={FARGE.vei} />
                    </mesh>
                </group>
            ))}
            {b.åser.map(([x, z, r], i) => (
                <group key={i} position={[x, 0, z]}>
                    <group scale={[1, ÅS_Y, 1]}>
                        <mesh material={åsMat}>
                            <sphereGeometry args={[r, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        </mesh>
                        <mesh material={åsKant}>
                            <sphereGeometry args={[r, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        </mesh>
                    </group>
                    {/* Gråstein i lyngen, så åsen leses som en kolle og ikke som et vann */}
                    {[0.4, 2.1, 3.9, 5.2].map((a, k) => (
                        <mesh
                            key={k}
                            material={steinMat}
                            position={[
                                Math.cos(a) * r * (0.35 + 0.12 * k),
                                r * ÅS_Y * 0.82,
                                Math.sin(a) * r * (0.35 + 0.12 * k),
                            ]}
                            scale={[1, 0.7, 1]}
                        >
                            <dodecahedronGeometry args={[0.38 + 0.12 * (k % 2), 0]} />
                        </mesh>
                    ))}
                </group>
            ))}
            {furu.length > 0 && (
                <>
                    <instancedMesh
                        ref={furuKrone}
                        args={[undefined, undefined, furu.length]}
                        material={furuMat}
                        frustumCulled={false}
                    >
                        <coneGeometry args={[0.75, 2.2, 7]} />
                    </instancedMesh>
                    <instancedMesh
                        ref={furuKant}
                        args={[undefined, undefined, furu.length]}
                        material={furuKantMat}
                        frustumCulled={false}
                    >
                        <coneGeometry args={[0.75, 2.2, 7]} />
                    </instancedMesh>
                    <instancedMesh
                        ref={furuStamme}
                        args={[undefined, undefined, furu.length]}
                        material={furuStammeMat}
                        frustumCulled={false}
                    >
                        <cylinderGeometry args={[0.12, 0.16, 0.9, 6]} />
                    </instancedMesh>
                </>
            )}
        </group>
    );
}

/** Hvor høye lyngbergene er i forhold til bredden. */
const ÅS_Y = 0.4;

function frø(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a * 1664525 + 1013904223) >>> 0;
        return a / 4294967296;
    };
}

const KRONER = [FARGE.skog, '#3d6e58', FARGE.skogLys, '#46705a'];
const M4 = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const V = new THREE.Vector3();
const SK = new THREE.Vector3();

/** Rosemalte trær: runde kroner med sotbrun kant. Instanser, så hundre trær er tre tegninger. */
export function Skog({ brett }: { brett: number }) {
    const q = useQuality();
    const b = BRETT[brett];
    const krone = useRef<THREE.InstancedMesh>(null);
    const kant = useRef<THREE.InstancedMesh>(null);
    const stamme = useRef<THREE.InstancedMesh>(null);
    const trær = useMemo(() => {
        const r = frø(31 + brett * 101);
        const ut: { x: number; z: number; s: number; f: number }[] = [];
        const ønsket = Math.round(150 * q.detail);
        const R = T.grense + 16;
        for (let n = 0; n < 2000 && ut.length < ønsket; n++) {
            const x = (r() * 2 - 1) * R;
            const z = (r() * 2 - 1) * R;
            const kant = Math.max(Math.abs(x), Math.abs(z)) > T.grense - 2;
            // Tettere skog i kanten av kartet, spredt inne på det.
            if (!kant && r() < 0.55) continue;
            if (b.bygder.some((t) => dist(x, z, t.x, t.z) < T.tun.radius + 2.6)) continue;
            if (b.fogder.some(([fx, fz]) => dist(x, z, fx, fz) < 3.5)) continue;
            if (b.åser.some(([ax, az, ar]) => dist(x, z, ax, az) < ar + 0.8)) continue;
            if (
                påVei(b, x, z) ||
                påVei(b, x + 1.4, z) ||
                påVei(b, x - 1.4, z) ||
                påVei(b, x, z + 1.4)
            )
                continue;
            if (dist(x, z, b.start[0], b.start[1]) < 4 || dist(x, z, b.ut[0], b.ut[1]) < 5)
                continue;
            // Ingen trær foran eller rundt skiltet nord for tunet.
            if (
                b.bygder.some(
                    (t) =>
                        Math.abs(x - t.x) < 5.2 &&
                        z < t.z - T.tun.radius + 1 &&
                        z > t.z - T.tun.radius - 6.5
                )
            )
                continue;
            if (ut.some((o) => dist(x, z, o.x, o.z) < 1.9)) continue;
            ut.push({ x, z, s: 0.8 + r() * 0.7, f: Math.floor(r() * KRONER.length) });
        }
        return ut;
    }, [b, brett, q.detail]);
    const n = trær.length;
    const kroneMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#ffffff' }), []);
    const kantMat = useMemo(() => konturMat(FARGE.blekk, 0.09), []);
    const stammeMat = useMemo(() => maltMat({ vertexColors: false, color: '#3b2a22' }), []);
    useEffect(() => {
        const c = new THREE.Color();
        trær.forEach((t, i) => {
            V.set(t.x, 1.15 + t.s * 0.75, t.z);
            Q.identity();
            SK.set(t.s, t.s * 0.88, t.s);
            M4.compose(V, Q, SK);
            krone.current?.setMatrixAt(i, M4);
            kant.current?.setMatrixAt(i, M4);
            V.set(t.x, 0, t.z);
            SK.set(1, t.s, 1);
            M4.compose(V, Q, SK);
            stamme.current?.setMatrixAt(i, M4);
            krone.current?.setColorAt(i, c.set(KRONER[t.f]));
        });
        for (const m of [krone.current, kant.current, stamme.current]) {
            if (!m) continue;
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
            m.computeBoundingSphere();
        }
    }, [trær]);
    if (!n) return null;
    return (
        <group key={`${brett}-${n}`} userData={{ sceneAuditIgnore: true }}>
            <instancedMesh ref={stamme} args={[TRE_STAMME, stammeMat, n]} />
            <instancedMesh ref={kant} args={[TRE_KRONE, kantMat, n]} />
            <instancedMesh ref={krone} args={[TRE_KRONE, kroneMat, n]} />
        </group>
    );
}

/** Fogdgårdene: grå embetsgårder med skifertak og oransje vindu. Døra blaffer opp når en mann
 *  går ut med lykt. Tegnes bare når de er i bildet (se synlig.ts). */
export function Fogdhus({ brett, sRef }: { brett: number; sRef: SRef }) {
    const b = BRETT[brett];
    const geo = useMemo(() => fogdGård(), []);
    const mat = useMemo(() => maltMat(), []);
    const kant = useMemo(() => konturMat(FARGE.fare, 0.07), []);
    const dører = useRef<(THREE.Mesh | null)[]>([]);
    const gårder = useRef<(THREE.Group | null)[]>([]);
    useEffect(() => () => geo.dispose(), [geo]);
    useFrame((st) => {
        const s = sRef.current;
        b.fogder.forEach(([x, z], i) => {
            kull(gårder.current[i], iBildet(st.camera, x, z, 1.6));
            const d = dører.current[i];
            if (!d) return;
            const siden = s.tid - (s.blaff[i] ?? -99);
            const k = Math.max(0, 1 - siden / 0.9);
            d.scale.set(1 + k * 0.6, 1 + k * 0.9, 1);
            (d.material as THREE.MeshBasicMaterial).color.set(
                k > 0.05 ? FARGE.fareLys : FARGE.fare
            );
        });
    });
    return (
        <>
            {b.fogder.map(([x, z], i) => (
                <group
                    key={i}
                    position={[x, 0, z]}
                    ref={(g) => {
                        gårder.current[i] = g;
                    }}
                >
                    <mesh geometry={geo} material={mat} />
                    <mesh geometry={geo} material={kant} />
                    {/* Døra og vinduet mot sør (mot kameraet) */}
                    <mesh
                        position={[0, 0.55, 0.86]}
                        ref={(m) => {
                            dører.current[i] = m;
                        }}
                    >
                        <planeGeometry args={[0.6, 1.1]} />
                        <meshBasicMaterial color={FARGE.fare} toneMapped={false} />
                    </mesh>
                    <mesh position={[0.8, 1.1, 0.86]}>
                        <planeGeometry args={[0.42, 0.42]} />
                        <meshBasicMaterial color={FARGE.fareLys} toneMapped={false} />
                    </mesh>
                    <mesh position={[1.7, 1.9, 0.9]}>
                        <sphereGeometry args={[0.2, 10, 8]} />
                        <meshBasicMaterial color={FARGE.fareLys} toneMapped={false} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

/** Stolpen ved utgangen mot neste ark. Vises når alle bygdene i brettet har segl. */
export function Utgang({ brett, gRef }: { brett: number; gRef: GRef }) {
    const b = BRETT[brett];
    const grp = useRef<THREE.Group>(null);
    const bølge = useRef<THREE.Mesh>(null);
    const neste = BRETT[brett + 1];
    const skilt = useMemo(() => {
        const c = crispCanvas(300, 110);
        const tegn = () =>
            c.draw((ctx, w, h) => {
                ctx.fillStyle = FARGE.kalk;
                ctx.strokeStyle = FARGE.blekk;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(10, 10);
                ctx.lineTo(w - 40, 10);
                ctx.lineTo(w - 6, h / 2);
                ctx.lineTo(w - 40, h - 10);
                ctx.lineTo(10, h - 10);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = FARGE.blekk;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `500 22px ${TEKST_FONT}`;
                ctx.fillText('Ri videre mot', w / 2 - 14, 34);
                ctx.font = `700 38px ${TITTEL_FONT}`;
                ctx.fillText(neste ? neste.tittel : '', w / 2 - 14, 74);
            });
        tegn();
        document.fonts?.load(`700 38px ${TITTEL_FONT}`).then(tegn, () => undefined);
        return c;
    }, [neste]);
    useEffect(() => () => skilt.tex.dispose(), [skilt]);
    useFrame((st) => {
        const g = gRef.current;
        const åpen = g.brett === brett && utÅpen(g);
        if (grp.current) grp.current.visible = åpen;
        kull(grp.current, åpen && iBildet(st.camera, b.ut[0], b.ut[1], 2.8));
        if (bølge.current) {
            // Bølgen vokser ut fra stolpen og blekner (stedet står stille).
            const k = (st.clock.elapsedTime * 0.8) % 1;
            bølge.current.scale.setScalar(1 + k * 1.6);
            (bølge.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k);
        }
    });
    if (!neste) return null;
    return (
        <group ref={grp} position={[b.ut[0], 0, b.ut[1]]} visible={false}>
            <mesh rotation={FLAT} position={[0, 0.06, 0]}>
                <ringGeometry args={[2.3, 2.8, 40]} />
                <meshBasicMaterial color={FARGE.navnLys} toneMapped={false} />
            </mesh>
            <mesh ref={bølge} rotation={FLAT} position={[0, 0.07, 0]}>
                <ringGeometry args={[2.3, 2.6, 40]} />
                <meshBasicMaterial color={FARGE.navnLys} transparent depthWrite={false} />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
                <boxGeometry args={[0.25, 2.8, 0.25]} />
                <meshLambertMaterial color={FARGE.kalk} />
            </mesh>
            <mesh position={[0, 3.1, 0.15]} rotation={[-0.35, 0, 0]}>
                <planeGeometry args={[3.6, 1.32]} />
                <meshBasicMaterial map={skilt.tex} transparent toneMapped={false} />
            </mesh>
        </group>
    );
}
