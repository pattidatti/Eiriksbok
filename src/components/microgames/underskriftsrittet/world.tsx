// Gråboksen: verden i primitive former. Hver farge betyr én ting:
// - hesten (brun kloss med hvit rytter) er deg,
// - blått er underskriftene: buen rundt tunet fylles, og den ender i et rødt segl,
// - oransje er fogden: mannen, lykta, lyspølen, streken mot bygda han går til og
//   fangstringen som fylles fra kanten rundt hesten,
// - lilla hus er Telemark, røde hus er Agder.
// Ingen kunst, ingen juice. Alt som beveger seg, leses fra spilltilstanden i useFrame.

import { useEffect, useMemo, useRef } from 'react';
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

// Buen rundt tunet: fylt blå med navnene, grå foran, og oransje merker på navnene som
// tenner en lykt. Starter øverst og går med klokka. Én tegning per tun.
const BUE_VERT = /* glsl */ `
varying vec2 vP;
void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const BUE_FRAG = /* glsl */ `
uniform float uFyll;
uniform float uAntall;
uniform float uFoerste;
uniform float uHvert;
uniform vec3 uNavn;
uniform vec3 uTom;
uniform vec3 uFare;
varying vec2 vP;
void main() {
    float a = atan(vP.x, vP.y);
    if (a < 0.0) a += 6.2831853;
    float f = a / 6.2831853;
    float n = f * uAntall;
    vec3 c = f < uFyll ? uNavn : uTom;
    float k = floor(n + 0.5);
    bool merke = abs(n - k) < 0.2 && k >= uFoerste && k < uAntall
        && mod(k - uFoerste, uHvert) < 0.5;
    if (merke) c = f < uFyll ? mix(uFare, uNavn, 0.6) : uFare;
    gl_FragColor = vec4(c, 1.0);
}`;

function lagBue(førsteLykt: number, navnPerLykt: number) {
    return new THREE.ShaderMaterial({
        vertexShader: BUE_VERT,
        fragmentShader: BUE_FRAG,
        uniforms: {
            uFyll: { value: 0 },
            uAntall: { value: T.tun.seglVed },
            uFoerste: { value: førsteLykt },
            uHvert: { value: navnPerLykt },
            uNavn: { value: new THREE.Color(FARGE.navn) },
            uTom: { value: new THREE.Color('#e8e2d0') },
            uFare: { value: new THREE.Color(FARGE.fare) },
        },
    });
}

/** Det som står stille i et brett: bakke, landevei, åser, tun og utgangen. */
export function Kart({ brett, gRef }: { brett: number; gRef: GRef }) {
    const b = BRETT[brett];
    const telemark = b.bygder.some((t) => t.telemark);
    const fyll = useRef<(THREE.Mesh | null)[]>([]);
    const segl = useRef<(THREE.Mesh | null)[]>([]);
    const ut = useRef<THREE.Group>(null);
    const buer = useMemo(
        () => b.bygder.map(() => lagBue(b.førsteLykt, b.navnPerLykt)),
        [b]
    );
    useEffect(() => () => buer.forEach((m) => m.dispose()), [buer]);
    useFrame(() => {
        const g = gRef.current;
        g.tun.forEach((t, i) => {
            const andel = t.samlet / T.tun.seglVed;
            const m = fyll.current[i];
            if (m) {
                m.scale.setScalar(Math.max(0.001, andel));
                (m.material as THREE.MeshBasicMaterial).opacity = t.segl ? 0.5 : 0.32;
            }
            const bue = buer[i];
            if (bue) bue.uniforms.uFyll.value = t.segl ? 1 : andel;
            const s = segl.current[i];
            if (s) s.visible = t.segl;
        });
        if (ut.current) ut.current.visible = g.brett === brett && utÅpen(g);
    });
    return (
        <group>
            <mesh rotation={FLAT} position={[0, -0.02, 0]}>
                <planeGeometry args={[T.grense * 2 + 40, T.grense * 2 + 40]} />
                <meshLambertMaterial color={telemark ? FARGE.grunnTelemark : FARGE.grunn} />
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
            {b.bygder.map((t, i) => {
                const hus = t.telemark ? FARGE.telemark : FARGE.blod;
                return (
                    <group key={t.navn} position={[t.x, 0, t.z]}>
                        {/* Framdriftsbuen rundt ringen */}
                        <mesh rotation={FLAT} position={[0, 0.04, 0]} material={buer[i]}>
                            <ringGeometry args={[T.tun.radius - 0.55, T.tun.radius, 72]} />
                        </mesh>
                        {/* Underskriftene fyller tunet fra midten */}
                        <mesh
                            rotation={FLAT}
                            position={[0, 0.02, 0]}
                            ref={(m) => {
                                fyll.current[i] = m;
                            }}
                        >
                            <circleGeometry args={[T.tun.radius - 0.55, 48]} />
                            <meshBasicMaterial color={FARGE.navn} transparent opacity={0.32} />
                        </mesh>
                        {[0, 1, 2].map((k) => {
                            const a = (k / 3) * Math.PI * 2 + 0.6;
                            return (
                                <mesh
                                    key={k}
                                    position={[Math.cos(a) * 2.6, 0.5, Math.sin(a) * 2.6]}
                                >
                                    <boxGeometry args={[1.4, 1, 1]} />
                                    <meshLambertMaterial color={hus} />
                                </mesh>
                            );
                        })}
                        {/* Seglet der buen ender: tom ring nå, rødt segl når bygda er ferdig */}
                        <mesh rotation={FLAT} position={[0, 0.06, -T.tun.radius]}>
                            <ringGeometry args={[0.7, 0.95, 32]} />
                            <meshBasicMaterial color={FARGE.blod} />
                        </mesh>
                        <mesh
                            position={[0, 0.25, -T.tun.radius]}
                            visible={false}
                            ref={(m) => {
                                segl.current[i] = m;
                            }}
                        >
                            <cylinderGeometry args={[1.25, 1.25, 0.5, 24]} />
                            <meshLambertMaterial color={FARGE.blod} />
                        </mesh>
                    </group>
                );
            })}
            <group ref={ut} position={[b.ut[0], 0, b.ut[1]]} visible={false}>
                <mesh rotation={FLAT} position={[0, 0.05, 0]}>
                    <ringGeometry args={[2.4, 3, 32]} />
                    <meshBasicMaterial color={FARGE.navn} />
                </mesh>
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[0.3, 3, 0.3]} />
                    <meshLambertMaterial color={FARGE.navn} />
                </mesh>
            </group>
        </group>
    );
}

const FANG_LAG = 6;
/** Lengste strek fra en lykt til bygda den går mot (meter). */
const STREK_MAKS = 20;
const FANG_R = 1.6;

/** Hvor pila peker: nærmeste bygd uten segl, eller utgangen når alle har segl. */
function nesteMål(g: Game): { x: number; z: number } | null {
    const h = g.hest;
    if (utÅpen(g)) {
        const b = BRETT[g.brett];
        return { x: b.ut[0], z: b.ut[1] };
    }
    let best: { x: number; z: number } | null = null;
    let bd = Infinity;
    for (const t of g.tun) {
        if (t.segl) continue;
        const d = dist(h.x, h.z, t.x, t.z);
        if (d < bd) {
            bd = d;
            best = t;
        }
    }
    return best;
}

/** Hesten, fangstringen rundt den og pila til neste bygd. */
export function Hest({ gRef }: { gRef: GRef }) {
    const hest = useRef<THREE.Group>(null);
    const fang = useRef<THREE.Group>(null);
    const pil = useRef<THREE.Group>(null);
    const pilForm = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0.9, 0);
        s.lineTo(-0.4, 0.55);
        s.lineTo(-0.15, 0);
        s.lineTo(-0.4, -0.55);
        s.closePath();
        return s;
    }, []);
    useFrame(() => {
        const g = gRef.current;
        const h = g.hest;
        if (hest.current) {
            hest.current.position.set(h.x, 0, h.z);
            hest.current.rotation.y = -h.retning;
        }
        if (fang.current) {
            // Lyset fyller ringen fra kanten og innover. Full ring = tatt.
            fang.current.position.set(h.x, 0.08, h.z);
            fang.current.visible = g.fangst > 0.01;
            const lag = fang.current.children;
            lag[0].visible = true;
            for (let k = 1; k <= FANG_LAG; k++) lag[k].visible = g.fangst > (k - 1) / FANG_LAG;
        }
        if (pil.current) {
            const m = nesteMål(g);
            const d = m ? dist(h.x, h.z, m.x, m.z) : 0;
            pil.current.visible = !!m && d > T.tun.radius + 1.5 && g.mode === 'play';
            if (m && pil.current.visible) {
                const a = Math.atan2(m.z - h.z, m.x - h.x);
                pil.current.position.set(h.x + Math.cos(a) * 2.8, 0.1, h.z + Math.sin(a) * 2.8);
                pil.current.rotation.y = -a;
            }
        }
    });
    return (
        <>
            <group ref={hest}>
                <mesh position={[0, 0.6, 0]}>
                    <boxGeometry args={[1.6, 0.8, 0.6]} />
                    <meshLambertMaterial color={FARGE.hest} />
                </mesh>
                <mesh position={[0.95, 0.95, 0]}>
                    <boxGeometry args={[0.5, 0.5, 0.4]} />
                    <meshLambertMaterial color={FARGE.hest} />
                </mesh>
                <mesh position={[0, 1.35, 0]}>
                    <boxGeometry args={[0.45, 0.8, 0.45]} />
                    <meshLambertMaterial color={FARGE.kalk} />
                </mesh>
                <mesh position={[0, 1.85, 0]}>
                    <boxGeometry args={[0.5, 0.2, 0.5]} />
                    <meshLambertMaterial color={FARGE.blekk} />
                </mesh>
            </group>
            <group ref={fang} visible={false}>
                <mesh rotation={FLAT}>
                    <ringGeometry args={[FANG_R, FANG_R + 0.12, 40]} />
                    <meshBasicMaterial color={FARGE.fare} />
                </mesh>
                {Array.from({ length: FANG_LAG }, (_, k) => {
                    const ytre = FANG_R * (1 - k / FANG_LAG);
                    const indre = FANG_R * (1 - (k + 1) / FANG_LAG);
                    return (
                        <mesh key={k} rotation={FLAT} position={[0, 0.005 * k, 0]}>
                            <ringGeometry args={[indre, ytre, 40]} />
                            <meshBasicMaterial
                                color={FARGE.fare}
                                transparent
                                opacity={0.8}
                                depthWrite={false}
                            />
                        </mesh>
                    );
                })}
            </group>
            <group ref={pil} visible={false}>
                <mesh rotation={FLAT}>
                    <shapeGeometry args={[pilForm]} />
                    <meshBasicMaterial color={FARGE.navn} />
                </mesh>
            </group>
        </>
    );
}

/** Lyktene og dragonene: en fast pool som flyttes, aldri nye mesher under spillet. */
export function Lykter({ gRef }: { gRef: GRef }) {
    const pool = useRef<(THREE.Group | null)[]>([]);
    const forrige = useRef<{ x: number; z: number; id: number }[]>([]);
    useFrame(() => {
        const g = gRef.current;
        for (let i = 0; i < T.lykt.maks; i++) {
            const o = pool.current[i];
            if (!o) continue;
            const l = g.lykter[i];
            o.visible = !!l;
            if (!l) continue;
            const f = forrige.current[i];
            const går = !!f && f.id === l.id && dist(f.x, f.z, l.x, l.z) > 1e-3;
            forrige.current[i] = { x: l.x, z: l.z, id: l.id };
            o.position.set(l.x, 0, l.z);
            const r = l.dragon ? T.dragon.lys : T.lykt.lys;
            const [pøl, kant, fogd, dragon, strek] = o.children as THREE.Object3D[];
            pøl.scale.setScalar(r);
            kant.scale.setScalar(r);
            ((pøl as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = l.farlig
                ? 0.45
                : 0.2;
            fogd.visible = !l.dragon;
            dragon.visible = l.dragon;
            dragon.rotation.y = -l.retning;
            // Mannen vugger når han går.
            fogd.position.y = går ? Math.abs(Math.sin(l.alder * 9)) * 0.18 : 0;
            fogd.rotation.z = går ? Math.sin(l.alder * 9) * 0.08 : 0;
            // Streken viser hvor han skal: til stedet der du skrev under. Den krymper når han
            // kommer nærmere, så du ser hvor lenge du kan skrive før du må ri.
            const dx = l.mx - l.x;
            const dz = l.mz - l.z;
            const lengde = Math.hypot(dx, dz);
            // Bare de nære: lange streker over hele kartet ble et kaos av linjer.
            const vis =
                !l.dragon &&
                l.modus !== 'står' &&
                lengde > T.lykt.leteRadius * 0.6 &&
                lengde < STREK_MAKS;
            strek.visible = vis;
            if (vis) {
                strek.rotation.y = -Math.atan2(dz, dx);
                const m = strek.children[0];
                m.position.x = lengde / 2;
                m.scale.x = lengde;
            }
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
                    {/* Lyset tegnes oppå åsene, så det aldri gjemmer seg bak en kolle */}
                    <mesh rotation={FLAT} position={[0, 0.06, 0]} renderOrder={2}>
                        <circleGeometry args={[1, 32]} />
                        <meshBasicMaterial
                            color={FARGE.fare}
                            transparent
                            opacity={0.45}
                            depthWrite={false}
                            depthTest={false}
                        />
                    </mesh>
                    <mesh rotation={FLAT} position={[0, 0.07, 0]} renderOrder={3}>
                        <ringGeometry args={[0.92, 1, 40]} />
                        <meshBasicMaterial color={FARGE.fare} depthTest={false} transparent />
                    </mesh>
                    {/* Fogdens mann: oransje kropp, hode og lykta i hånda */}
                    <group scale={1.35}>
                        <mesh position={[0, 0.75, 0]}>
                            <cylinderGeometry args={[0.28, 0.4, 1.5, 10]} />
                            <meshLambertMaterial color={FARGE.fare} />
                        </mesh>
                        <mesh position={[0, 1.7, 0]}>
                            <sphereGeometry args={[0.28, 12, 8]} />
                            <meshLambertMaterial color={FARGE.fare} />
                        </mesh>
                        <mesh position={[0.5, 1.1, 0]}>
                            <sphereGeometry args={[0.26, 12, 8]} />
                            <meshBasicMaterial color={FARGE.fareLys} />
                        </mesh>
                    </group>
                    <mesh position={[0, 0.9, 0]}>
                        <coneGeometry args={[0.7, 1.8, 3]} />
                        <meshLambertMaterial color={FARGE.fare} />
                    </mesh>
                    <group visible={false}>
                        <mesh rotation={FLAT} position={[0, 0.05, 0]}>
                            <planeGeometry args={[1, 0.22]} />
                            <meshBasicMaterial
                                color={FARGE.fare}
                                transparent
                                opacity={0.7}
                                depthWrite={false}
                            />
                        </mesh>
                    </group>
                </group>
            ))}
        </>
    );
}
