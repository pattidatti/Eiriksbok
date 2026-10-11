// Visningen av Brevnettet (gråboks): veven, stuene, Hauge, trådene, brevene og lensmannen
// med primitive former. Alt leses fra spilltilstanden i useFrame - ingen React-state per bilde.

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { TUNING } from './tuning';
import { HAUGE, avstand, iFare, type Punkt } from './net';
import { FARGE, treff, type Drag, type Spøkelse } from './view';
import { kanBinde, node, type Game } from './game';

const V = TUNING.vev;
const MAKS_S = TUNING.maksStuer;
const MAKS_T = TUNING.maksTråder;
const Z = 0.22;

type GRef = React.MutableRefObject<Game>;

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const skala = new THREE.Vector3();
const zAkse = new THREE.Vector3(0, 0, 1);
const farge = new THREE.Color();
const GUL = new THREE.Color(FARGE.gul);
const dragMat = new THREE.MeshBasicMaterial({ color: FARGE.svart });
const spøkMat = new THREE.MeshBasicMaterial({
    color: FARGE.svart,
    transparent: true,
    opacity: 0.4,
});

/** Plasser en boks (lengde 1 langs x) mellom to punkter. */
function strekk(a: Punkt, b: Punkt, tykk: number, z: number, out: THREE.Matrix4) {
    const len = Math.max(0.001, avstand(a, b));
    pos.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
    q.setFromAxisAngle(zAkse, Math.atan2(b.y - a.y, b.x - a.x));
    skala.set(len, tykk, tykk);
    return out.compose(pos, q, skala);
}

/** Veven: grunnen, rammen, overbommen og kljåsteinene. */
export function Vev({ gRef }: { gRef: GRef }) {
    const steiner = useRef<(THREE.Mesh | null)[]>([]);
    useFrame((_, dt) => {
        const g = gRef.current;
        steiner.current.forEach((m, i) => {
            if (!m) return;
            const falt = i < g.steiner;
            const mål = falt ? -9 : V.minY - 1.6;
            m.position.y += (mål - m.position.y) * Math.min(1, dt * 6);
        });
    });
    const bredde = V.maxX - V.minX + 1.6;
    const høyde = V.maxY - V.minY + 2.2;
    const midtY = (V.maxY + V.minY) / 2 + 0.3;
    return (
        <group>
            <mesh position={[0, midtY, -0.06]}>
                <boxGeometry args={[bredde, høyde, 0.1]} />
                <meshStandardMaterial color={FARGE.ull} roughness={1} />
            </mesh>
            {/* Overbommen og stolpene */}
            <mesh position={[0, midtY + høyde / 2 + 0.2, 0.1]}>
                <boxGeometry args={[bredde + 1.4, 0.4, 0.4]} />
                <meshStandardMaterial color={FARGE.brun} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[s * (bredde / 2 + 0.5), midtY - 0.8, 0.1]}>
                    <boxGeometry args={[0.35, høyde + 3, 0.35]} />
                    <meshStandardMaterial color={FARGE.brun} />
                </mesh>
            ))}
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        steiner.current[i] = m;
                    }}
                    position={[-1.6 + i * 1.6, V.minY - 1.6, 0.15]}
                >
                    <boxGeometry args={[0.7, 0.6, 0.4]} />
                    <meshStandardMaterial color="#8a8580" />
                </mesh>
            ))}
        </group>
    );
}

/** Stuene (bokser), ringen av ventende folk (en stolpe som vokser) og rødt blink ved fare. */
export function Stuer({ gRef }: { gRef: GRef }) {
    const hus = useRef<THREE.InstancedMesh>(null);
    const ring = useRef<THREE.InstancedMesh>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        const g = gRef.current;
        const h = hus.current;
        const r = ring.current;
        if (!h || !r) return;
        const fare = new Set(g.lens ? iFare(g.stuer, g.tråder).map((s) => s.id) : []);
        const kutt = new Set<number>();
        for (const t of g.tråder) if (t.kutt > 0) [t.a, t.b].forEach((id) => kutt.add(id));
        const blink = Math.sin(tid.current * 12) > 0;
        let i = 0;
        for (const s of g.stuer.values()) {
            const vokse = s.tent >= 0 ? Math.min(1, s.tent * 4) : 1;
            const st = 1 + (s.lys ? 0.25 * vokse : 0);
            m4.compose(pos.set(s.x, s.y, Z), q.identity(), skala.set(st, st, st));
            h.setMatrixAt(i, m4);
            const iFareNå = (fare.has(s.id) || (kutt.has(s.id) && s.lys)) && blink;
            farge.set(iFareNå ? FARGE.rød : s.lys ? FARGE.gul : FARGE.brun);
            if (s.rakner >= 0 && s.rakner < 0.6) farge.lerp(GUL, 1 - s.rakner / 0.6);
            h.setColorAt(i, farge);
            // Ringen: en stolpe under stua som fylles mot rødt.
            const fyll = s.lys ? 0 : s.ring;
            m4.compose(
                pos.set(s.x - 0.45 + 0.45 * fyll, s.y - 0.62, Z),
                q.identity(),
                skala.set(Math.max(0.001, fyll), fyll > 0 ? 1 : 0.001, 1)
            );
            r.setMatrixAt(i, m4);
            farge.set(fyll > TUNING.ring.snartFull ? FARGE.rød : FARGE.brun);
            r.setColorAt(i, farge);
            i++;
        }
        h.count = i;
        r.count = i;
        h.instanceMatrix.needsUpdate = true;
        r.instanceMatrix.needsUpdate = true;
        if (h.instanceColor) h.instanceColor.needsUpdate = true;
        if (r.instanceColor) r.instanceColor.needsUpdate = true;
    });
    return (
        <group>
            <instancedMesh ref={hus} args={[undefined, undefined, MAKS_S]} frustumCulled={false}>
                <boxGeometry args={[0.8, 0.7, 0.3]} />
                <meshStandardMaterial />
            </instancedMesh>
            <instancedMesh ref={ring} args={[undefined, undefined, MAKS_S]} frustumCulled={false}>
                <boxGeometry args={[0.9, 0.14, 0.12]} />
                <meshStandardMaterial />
            </instancedMesh>
        </group>
    );
}

/** Trådene, brevene på dem, dra-tråden og spøkelsestråden. */
export function Garn({
    gRef,
    dragRef,
    spøkelseRef,
}: {
    gRef: GRef;
    dragRef: React.MutableRefObject<Drag | null>;
    spøkelseRef: React.MutableRefObject<Spøkelse | null>;
}) {
    const tråd = useRef<THREE.InstancedMesh>(null);
    const brev = useRef<THREE.InstancedMesh>(null);
    const drag = useRef<THREE.Mesh>(null);
    const spøk = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        tid.current += dt;
        const g = gRef.current;
        const t = tråd.current;
        const b = brev.current;
        if (!t || !b) return;
        let i = 0;
        let j = 0;
        const blink = Math.sin(tid.current * 12) > 0;
        for (const x of g.tråder) {
            const a = node(g, x.a);
            const c = node(g, x.b);
            if (!a || !c) continue;
            const hauge = x.a === HAUGE || x.b === HAUGE;
            t.setMatrixAt(i, strekk(a, c, 0.12, Z - 0.05, m4));
            farge.set(x.kutt > 0 && blink ? FARGE.rød : hauge ? FARGE.indigo : FARGE.gul);
            t.setColorAt(i, farge);
            i++;
            const p = { x: a.x + (c.x - a.x) * x.brev, y: a.y + (c.y - a.y) * x.brev };
            m4.compose(pos.set(p.x, p.y, Z + 0.12), q.identity(), skala.set(1, 1, 1));
            b.setMatrixAt(j++, m4);
        }
        t.count = i;
        b.count = j;
        t.instanceMatrix.needsUpdate = true;
        b.instanceMatrix.needsUpdate = true;
        if (t.instanceColor) t.instanceColor.needsUpdate = true;

        const d = dragRef.current;
        const dm = drag.current;
        if (dm) {
            const fra = d ? node(g, d.fra) : null;
            dm.visible = !!(d && fra);
            if (d && fra) {
                const til = treff(g, d);
                const mål = til !== null && til !== d.fra ? node(g, til) : null;
                const ok = mål ? kanBinde(g, d.fra, til!) : true;
                dragMat.color.set(ok ? (d.fra === HAUGE ? FARGE.indigo : FARGE.svart) : FARGE.rød);
                const slutt = mål ?? d;
                strekk(fra, slutt, 0.09, Z, m4);
                m4.decompose(dm.position, dm.quaternion, dm.scale);
            }
        }
        const s = spøkelseRef.current;
        const sm = spøk.current;
        if (sm) {
            const a = s ? node(g, s.a) : null;
            const c = s ? node(g, s.b) : null;
            sm.visible = !!(a && c);
            if (a && c) {
                strekk(a, c, 0.1, Z + 0.02, m4);
                m4.decompose(sm.position, sm.quaternion, sm.scale);
                spøkMat.opacity = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(tid.current * 5));
            }
        }
    });
    return (
        <group>
            <instancedMesh ref={tråd} args={[undefined, undefined, MAKS_T]} frustumCulled={false}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial />
            </instancedMesh>
            <instancedMesh ref={brev} args={[undefined, undefined, MAKS_T]} frustumCulled={false}>
                <boxGeometry args={[0.26, 0.18, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
            </instancedMesh>
            <mesh ref={drag} material={dragMat} visible={false}>
                <boxGeometry args={[1, 1, 1]} />
            </mesh>
            <mesh ref={spøk} material={spøkMat} visible={false}>
                <boxGeometry args={[1, 1, 1]} />
            </mesh>
        </group>
    );
}

/** Hauge (indigo søyle med svart hatt) og lensmannen (rød boks som rir mot ham). */
export function Figurer({ gRef }: { gRef: GRef }) {
    const hauge = useRef<THREE.Group>(null);
    const lens = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const g = gRef.current;
        const h = hauge.current;
        if (h) {
            h.visible = !g.hauge.inne;
            h.position.set(g.hauge.x, g.hauge.y, Z);
        }
        const l = lens.current;
        if (l) {
            l.visible = !!g.lens;
            if (g.lens) {
                const k = Math.min(1, g.lens.t / g.lens.varsel);
                l.position.set(
                    g.lens.fra.x + (g.hauge.x - g.lens.fra.x) * k,
                    g.lens.fra.y + (g.hauge.y - g.lens.fra.y) * k,
                    Z + 0.3
                );
            }
        }
    });
    return (
        <group>
            <group ref={hauge}>
                <mesh>
                    <cylinderGeometry args={[0.32, 0.4, 0.9, 12]} />
                    <meshStandardMaterial color={FARGE.indigo} />
                </mesh>
                <mesh position={[0, 0.55, 0]}>
                    <boxGeometry args={[0.7, 0.2, 0.5]} />
                    <meshStandardMaterial color={FARGE.svart} />
                </mesh>
            </group>
            <mesh ref={lens} visible={false}>
                <boxGeometry args={[1, 0.8, 0.4]} />
                <meshStandardMaterial color={FARGE.rød} />
            </mesh>
        </group>
    );
}

/** Usynlig flate foran veven som fanger dra og klikk. */
export function Inndata({
    onNed,
    onFlytt,
    onOpp,
}: {
    onNed: (p: Punkt) => void;
    onFlytt: (p: Punkt) => void;
    onOpp: (p: Punkt) => void;
}) {
    const punkt = (e: ThreeEvent<PointerEvent>) => ({ x: e.point.x, y: e.point.y });
    return (
        <mesh
            position={[0, 0, Z]}
            onPointerDown={(e) => {
                e.stopPropagation();
                const el = e.target as unknown as { setPointerCapture?: (id: number) => void };
                el.setPointerCapture?.(e.pointerId);
                onNed(punkt(e));
            }}
            onPointerMove={(e) => onFlytt(punkt(e))}
            onPointerUp={(e) => onOpp(punkt(e))}
        >
            <planeGeometry args={[60, 40]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
    );
}

/** Fast kamera skrått forfra (fra venstre og litt nedenfra), med en svak pust. */
export function Kamera() {
    const t = useRef(0);
    useFrame((state, dt) => {
        t.current += dt;
        const c = state.camera;
        const pust = Math.sin(t.current * 0.6) * 0.06;
        c.position.set(-3.9 + pust, -2.2, 14.6);
        c.lookAt(0, -0.2, 0);
    });
    return null;
}
