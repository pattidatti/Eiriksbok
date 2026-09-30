// Det som beveger seg i kapellet: løse planker, tørr puss i kjede, Bramantes tau-stillas,
// taljene og talje-heisen, trekken fra vinduene, funnene, sjekkpunktene, puss-klokka i taket og
// kalkslammet. Figurene bor i figures.tsx, rommet og det faste stillaset i chapel.tsx.
//
// Lesbarheten er hellig: det som bærer (veggbjelkene) er mørk gran med jernbeslag inn i muren;
// løse planker er bleke, slitte og har rød flis på endene; tau-stillaset henger i fire tau og
// har rødt bånd. Alt leses fra banen (g.L), så begge banene og den speilvendte bruker det samme.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crispCanvas } from '../kit/crispText';
import { toonGradientMap } from '../kit/toonGradient';
import { ROOM, type Level } from './level';
import { crumbleFallAt, hookU, loadY, windState, panicLen, nextGoal, HEIS_LOAD, type G } from './game';
import { groundBelow } from './camera';
import { PAL } from './look';
import { boxGeo, hazeify, scaffoldMaterials } from './materials';
import { ART, makeCanvas, paintSoft, paintWetPatch, rng, toTexture } from './paint';
import { PAINT_DUR, PAINT_START, paintPanel } from './panels';
import type { FxPool } from './fx';

type GRef = React.MutableRefObject<G>;

const toon = (o: THREE.MeshToonMaterialParameters) =>
    hazeify(new THREE.MeshToonMaterial({ gradientMap: toonGradientMap(), ...o }));

const TMP_A = new THREE.Vector3();
const TMP_B = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const P1 = new THREE.Vector3();
const P2 = new THREE.Vector3();

/** Legger en sylinder (høyde 1) mellom to punkter. */
function setSegment(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
    TMP_A.subVectors(b, a);
    const len = TMP_A.length();
    m.position.copy(a).addScaledVector(TMP_A, 0.5);
    m.scale.set(1, Math.max(0.01, len), 1);
    m.quaternion.setFromUnitVectors(UP, TMP_A.normalize());
}

const ROPE_MAT = toon({ color: '#a88352' });
const IRON_MAT = toon({ color: '#3b3632' });
const SACK_MAT = toon({ color: '#cdb07c', emissive: new THREE.Color('#2a2010') });
const WHEEL_MAT = toon({ color: '#6b4a2b' });
const ROPE_GEO = new THREE.CylinderGeometry(0.035, 0.035, 1, 5);

let SOFT: THREE.CanvasTexture | null = null;
const soft = () => (SOFT ??= paintSoft());

// ---------------------------------------------------------------------------
// Løse planker: knaker og rister, drysser sagflis, faller
// ---------------------------------------------------------------------------

export function Planks({ gRef, L, fx }: { gRef: GRef; L: Level; fx: FxPool }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const fell = useRef<boolean[]>([]);
    const dustT = useRef(0);
    const geos = useMemo(
        () =>
            L.planks.map((pg) => {
                const wood = pg.boxes.map((b, k) => boxGeo([b.min[0] + 0.02, b.min[1], b.min[2]], [b.max[0] - 0.02, b.max[1], b.max[2]], (k % 2) * 0.06 - 0.03));
                // Rød flis på endene: det som ikke er festet, er merket
                const tips = pg.boxes.flatMap((b) => {
                    const alongX = b.max[0] - b.min[0] >= b.max[2] - b.min[2];
                    const t = 0.18;
                    return alongX
                        ? [
                              boxGeo([b.min[0] + 0.02, b.min[1] - 0.005, b.min[2] - 0.005], [b.min[0] + t, b.max[1] + 0.005, b.max[2] + 0.005]),
                              boxGeo([b.max[0] - t, b.min[1] - 0.005, b.min[2] - 0.005], [b.max[0] - 0.02, b.max[1] + 0.005, b.max[2] + 0.005]),
                          ]
                        : [
                              boxGeo([b.min[0] - 0.005, b.min[1] - 0.005, b.min[2]], [b.max[0] + 0.005, b.max[1] + 0.005, b.min[2] + t]),
                              boxGeo([b.min[0] - 0.005, b.min[1] - 0.005, b.max[2] - t], [b.max[0] + 0.005, b.max[1] + 0.005, b.max[2]]),
                          ];
                });
                return { wood, tips };
            }),
        [L]
    );
    const mats = scaffoldMaterials();
    useFrame((state, rawDt) => {
        const g = gRef.current;
        dustT.current += rawDt;
        const drip = dustT.current > 0.09;
        if (drip) dustT.current = 0;
        L.planks.forEach((pg, i) => {
            const grp = refs.current[i];
            if (!grp) return;
            const t = g.plankT[i];
            const creak = t >= pg.creak && t < pg.fall;
            const pre = t >= 0 && t < pg.creak;
            const amp = creak ? 0.045 : pre ? 0.01 : 0;
            const shake = Math.sin(state.clock.elapsedTime * 70) * amp;
            grp.position.set(shake, g.plankY[i] + Math.abs(shake) * 0.5, 0);
            grp.rotation.z = t >= pg.fall ? Math.min(0.7, (t - pg.fall) * 1.6) : creak ? shake * 0.4 : 0;
            grp.rotation.x = t >= pg.fall ? Math.min(0.4, (t - pg.fall) * 0.8) : 0;
            grp.visible = g.plankY[i] > -12;
            const b = pg.boxes[Math.floor(pg.boxes.length / 2)];
            const mid: [number, number, number] = [(b.min[0] + b.max[0]) / 2, b.min[1] - 0.05, (b.min[2] + b.max[2]) / 2];
            if (creak && drip) fx.burst('sawdust', [mid[0] + (Math.random() - 0.5) * (b.max[0] - b.min[0]), mid[1], mid[2]], 1);
            if (t < 0) fell.current[i] = false;
            else if (t >= pg.fall && !fell.current[i]) {
                fell.current[i] = true;
                fx.burst('chips', [mid[0], mid[1] + 0.1, mid[2]], 10, 1.5);
                fx.burst('dust', [mid[0], mid[1], mid[2]], 6);
            }
        });
    });
    return (
        <group>
            {L.planks.map((_pg, i) => (
                <group key={i} ref={(el) => void (refs.current[i] = el)}>
                    {geos[i].wood.map((geo, k) => (
                        <mesh key={k} geometry={geo} material={mats.plank} receiveShadow />
                    ))}
                    {geos[i].tips.map((geo, k) => (
                        <mesh key={`t${k}`} geometry={geo} material={mats.red} />
                    ))}
                </group>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Tørr puss i kjede: flisene rister, sprekker og faller én og én
// ---------------------------------------------------------------------------

export function Crumbles({ gRef, L, fx }: { gRef: GRef; L: Level; fx: FxPool }) {
    const refs = useRef<(THREE.Mesh | null)[][]>([]);
    const fired = useRef<boolean[][]>([]);
    const mats = scaffoldMaterials();
    const geos = useMemo(
        () =>
            L.crumbles.map((c) =>
                c.tiles.map((b) => {
                    const g = boxGeo([b.min[0] + 0.03, b.min[1], b.min[2]], [b.max[0] - 0.03, b.max[1], b.max[2]]);
                    g.translate(-(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2, -(b.min[2] + b.max[2]) / 2);
                    return g;
                })
            ),
        [L]
    );
    useFrame((state) => {
        const g = gRef.current;
        L.crumbles.forEach((c, i) => {
            const t = g.crumbleT[i];
            const f = (fired.current[i] ??= []);
            c.tiles.forEach((b, k) => {
                const m = refs.current[i]?.[k];
                if (!m) return;
                const cx = (b.min[0] + b.max[0]) / 2;
                const cy = (b.min[1] + b.max[1]) / 2;
                const cz = (b.min[2] + b.max[2]) / 2;
                const at = crumbleFallAt(c, k);
                if (t < 0) {
                    m.position.set(cx, cy, cz);
                    m.rotation.set(0, 0, 0);
                    m.visible = true;
                    f[k] = false;
                    return;
                }
                const s = t - at;
                if (s < 0) {
                    const sh = s > -0.35 ? Math.sin(state.clock.elapsedTime * 80 + k) * 0.035 : 0;
                    m.position.set(cx + sh, cy, cz);
                    return;
                }
                if (!f[k]) {
                    f[k] = true;
                    fx.burst('plaster', [cx, b.max[1], cz], 6, 1.2);
                    fx.burst('dust', [cx, b.max[1], cz], 3);
                }
                m.position.set(cx, cy - 20 * s * s, cz);
                m.rotation.set(s * 3, 0, s * 2);
                m.visible = s < 1.5;
            });
        });
    });
    return (
        <group>
            {L.crumbles.map((c, i) =>
                c.tiles.map((b, k) => (
                    <mesh
                        key={b.id}
                        geometry={geos[i][k]}
                        material={mats.dry}
                        ref={(el) => {
                            (refs.current[i] ??= [])[k] = el;
                        }}
                        receiveShadow
                    />
                ))
            )}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Bramantes tau-stillas: en plattform i fire tau fra hull i hvelvet
// ---------------------------------------------------------------------------

function bramanteSign() {
    const b = crispCanvas(256, 64);
    b.draw((ctx, w, h) => {
        ctx.fillStyle = '#e8d6ae';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = ART.red;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, w - 6, h - 6);
        ctx.fillStyle = ART.ink;
        ctx.font = '900 30px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BRAMANTE', w / 2, h / 2 + 1);
    });
    return b;
}

export function Stages({ gRef, L }: { gRef: GRef; L: Level }) {
    const refs = useRef<{ box: THREE.Group | null; ropes: (THREE.Mesh | null)[]; trolley: THREE.Mesh | null }[]>([]);
    const mats = scaffoldMaterials();
    const sign = useMemo(() => bramanteSign(), []);
    useEffect(() => () => sign.tex.dispose(), [sign]);
    const geos = useMemo(
        () =>
            L.stages.map((s) => ({
                deck: boxGeo([-s.half[0], -s.half[1], -s.half[2]], [s.half[0], s.half[1], s.half[2]]),
                band: boxGeo([-s.half[0] - 0.01, -s.half[1] - 0.01, s.half[2] - 0.12], [s.half[0] + 0.01, s.half[1] + 0.01, s.half[2] + 0.01]),
            })),
        [L]
    );
    useFrame(() => {
        const g = gRef.current;
        L.stages.forEach((st, i) => {
            const r = refs.current[i];
            const s = g.stage[i];
            if (!r) return;
            r.box?.position.set(s[0], s[1], s[2]);
            // Tauene går rett opp til en løpekatt i hvelvet, så de aldri krysser bildet
            const corners: [number, number][] = [
                [-st.half[0] + 0.08, -st.half[2] + 0.08],
                [st.half[0] - 0.08, -st.half[2] + 0.08],
                [-st.half[0] + 0.08, st.half[2] - 0.08],
                [st.half[0] - 0.08, st.half[2] - 0.08],
            ];
            corners.forEach(([dx, dz], k) => {
                const m = r.ropes[k];
                if (!m) return;
                P1.set(s[0] + dx, s[1] + st.half[1], s[2] + dz);
                setSegment(m, P1, TMP_B.set(s[0] + dx * 0.3, ROOM.h - 0.3, s[2] + dz * 0.3));
            });
            r.trolley?.position.set(s[0], ROOM.h - 0.2, s[2]);
        });
    });
    return (
        <group>
            {L.stages.map((s, i) => {
                const r = (refs.current[i] ??= { box: null, ropes: [], trolley: null });
                return (
                    <group key={i}>
                        <group ref={(el) => void (r.box = el)}>
                            <mesh geometry={geos[i].deck} material={mats.deck} castShadow receiveShadow />
                            <mesh geometry={geos[i].band} material={mats.red} />
                            <mesh position={[0, -s.half[1] - 0.2, s.half[2] + 0.02]}>
                                <planeGeometry args={[1.0, 0.25]} />
                                <meshBasicMaterial map={sign.tex} toneMapped={false} />
                            </mesh>
                        </group>
                        {[0, 1, 2, 3].map((k) => (
                            <mesh key={k} geometry={ROPE_GEO} material={ROPE_MAT} ref={(el) => void (r.ropes[k] = el)} />
                        ))}
                        <mesh ref={(el) => void (r.trolley = el)} material={IRON_MAT}>
                            <boxGeometry args={[0.7, 0.3, 0.5]} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Taljene: en sekk med kalk som svinger over bjelken
// ---------------------------------------------------------------------------

const SACK_GEO = (() => {
    const g = new THREE.SphereGeometry(1, 10, 8);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const k = y > 0.4 ? 0.55 + (1 - y) * 0.6 : 1;
        p.setX(i, p.getX(i) * k);
        p.setZ(i, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
})();

export function Taljer({ gRef, L }: { gRef: GRef; L: Level }) {
    const refs = useRef<{ box: THREE.Mesh | null; rope: THREE.Mesh | null }[]>([]);
    useFrame(() => {
        const g = gRef.current;
        L.taljer.forEach((tj, i) => {
            const r = refs.current[i];
            const t = g.talje[i];
            if (!r) return;
            r.box?.position.set(t[0], t[1] + tj.half, t[2]);
            if (r.box) r.box.rotation.x = (t[2] - tj.zc) * 0.25;
            if (r.rope) setSegment(r.rope, P1.set(t[0], t[1] + tj.half * 1.9, t[2]), P2.set(tj.x, ROOM.h - 0.25, tj.zc));
        });
    });
    return (
        <group>
            {L.taljer.map((tj, i) => {
                const r = (refs.current[i] ??= { box: null, rope: null });
                return (
                    <group key={i}>
                        <mesh ref={(el) => void (r.box = el)} geometry={SACK_GEO} material={SACK_MAT} scale={[tj.half, tj.half * 1.05, tj.half]} castShadow />
                        <mesh ref={(el) => void (r.rope = el)} geometry={ROPE_GEO} material={ROPE_MAT} />
                        <mesh position={[tj.x, ROOM.h - 0.25, tj.zc]} rotation={[0, 0, Math.PI / 2]} material={IRON_MAT}>
                            <cylinderGeometry args={[0.22, 0.22, 0.1, 12]} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

/** Talje-heisen: kroken (motvekten) og sekken, over én trinse oppe i hvelvet. */
export function Heiser({ gRef, L }: { gRef: GRef; L: Level }) {
    const refs = useRef<{ hook: THREE.Group | null; load: THREE.Mesh | null; r1: THREE.Mesh | null; r2: THREE.Mesh | null }[]>([]);
    const wheel = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(() => {
        const g = gRef.current;
        L.heiser.forEach((h, i) => {
            const r = refs.current[i];
            if (!r) return;
            const hy = h.y0 + 0.35 + hookU(h, g.t) * h.lift + 1.9;
            const ly = loadY(h, g.t) + HEIS_LOAD;
            r.hook?.position.set(h.x, hy, h.z);
            r.load?.position.set(h.x + h.loadDx, ly, h.z);
            const top = ROOM.h - 0.5;
            if (r.r1) setSegment(r.r1, P1.set(h.x, hy + 0.15, h.z), P2.set(h.x, top, h.z));
            if (r.r2) setSegment(r.r2, P1.set(h.x + h.loadDx, ly + HEIS_LOAD, h.z), P2.set(h.x + h.loadDx, top, h.z));
            const w = wheel.current[i];
            if (w) w.rotation.y = hy * 2.2;
        });
    });
    return (
        <group>
            {L.heiser.map((h, i) => {
                const r = (refs.current[i] ??= { hook: null, load: null, r1: null, r2: null });
                const rad = Math.abs(h.loadDx) / 2 + 0.05;
                return (
                    <group key={i}>
                        {/* Trinsa i hvelvet */}
                        <group position={[h.x + h.loadDx / 2, ROOM.h - 0.5, h.z]} rotation={[Math.PI / 2, 0, 0]}>
                            <mesh ref={(el) => void (wheel.current[i] = el)} material={WHEEL_MAT}>
                                <cylinderGeometry args={[rad, rad, 0.15, 14]} />
                            </mesh>
                            <mesh material={IRON_MAT}>
                                <torusGeometry args={[rad, 0.03, 5, 16]} />
                            </mesh>
                        </group>
                        <group ref={(el) => void (r.hook = el)}>
                            <mesh material={IRON_MAT} rotation={[0, 0, 0]}>
                                <torusGeometry args={[0.16, 0.04, 6, 12, Math.PI * 1.5]} />
                            </mesh>
                            <mesh position={[0, 0.2, 0]} material={IRON_MAT}>
                                <boxGeometry args={[0.08, 0.2, 0.08]} />
                            </mesh>
                        </group>
                        <mesh ref={(el) => void (r.load = el)} geometry={SACK_GEO} material={SACK_MAT} scale={[HEIS_LOAD, HEIS_LOAD * 1.05, HEIS_LOAD]} castShadow />
                        <mesh ref={(el) => void (r.r1 = el)} geometry={ROPE_GEO} material={ROPE_MAT} />
                        <mesh ref={(el) => void (r.r2 = el)} geometry={ROPE_GEO} material={ROPE_MAT} />
                    </group>
                );
            })}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Trekken: støvslør som blafrer i vinduet ved varsel og blåser ut i rommet ved vindkast
// ---------------------------------------------------------------------------

export function Winds({ gRef, L }: { gRef: GRef; L: Level }) {
    const N = 9;
    const refs = useRef<(THREE.Mesh | null)[][]>([]);
    useFrame((state) => {
        const g = gRef.current;
        const tt = state.clock.elapsedTime;
        L.winds.forEach((w, i) => {
            const s = windState(w, g.t);
            const ph = (((g.t - w.offset) % w.period) + w.period) % w.period;
            const face = w.max[2] > 0 ? ROOM.z1 : ROOM.z0;
            for (let k = 0; k < N; k++) {
                const m = refs.current[i]?.[k];
                if (!m) continue;
                const x = w.min[0] + ((k + 0.5) / N) * (w.max[0] - w.min[0]);
                const y = 8.8 + ((k * 7) % 5) * 0.65;
                const mat = m.material as THREE.MeshBasicMaterial;
                if (s === 'rolig') {
                    m.visible = false;
                    continue;
                }
                m.visible = true;
                if (s === 'varsel') {
                    const out = 0.3 + 0.2 * Math.sin(tt * 12 + k);
                    m.position.set(x, y, face + w.dir[1] * out);
                    m.scale.set(1, 1, 0.6);
                    mat.opacity = 0.35;
                } else {
                    const out = 0.4 + ((ph * 5 + k * 0.7) % 4.5);
                    m.position.set(x, y - out * 0.15, face + w.dir[1] * out);
                    m.scale.set(1, 1, 1 + out * 0.3);
                    mat.opacity = 0.7 * (1 - out / 5);
                }
            }
        });
    });
    return (
        <group>
            {L.winds.map((_w, i) =>
                Array.from({ length: N }, (_, k) => (
                    <mesh
                        key={`${i}-${k}`}
                        ref={(el) => {
                            (refs.current[i] ??= [])[k] = el;
                        }}
                        rotation={[-Math.PI / 2, 0, 0]}
                        visible={false}
                        renderOrder={6}
                    >
                        <planeGeometry args={[0.9, 1.4]} />
                        <meshBasicMaterial
                            map={soft()}
                            color="#ffffff"
                            transparent
                            opacity={0.6}
                            depthWrite={false}
                            side={THREE.DoubleSide}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                ))
            )}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Skygge-blob rett under figuren og paven: hoppehjelpen (alltid, også på lav)
// ---------------------------------------------------------------------------

export function Blobs({ gRef }: { gRef: GRef }) {
    const me = useRef<THREE.Mesh>(null);
    const pope = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const g = gRef.current;
        const place = (m: THREE.Mesh | null, x: number, y: number, z: number, on: boolean) => {
            if (!m) return;
            m.visible = on;
            if (!on) return;
            const gy = groundBelow(g, x, z, y);
            const h = Math.max(0, y - gy);
            m.position.set(x, gy + 0.03, z);
            const s = Math.max(0.45, 1 - h * 0.06);
            m.scale.set(s, s, s);
            (m.material as THREE.MeshBasicMaterial).opacity = 0.55 * Math.max(0.35, 1 - h * 0.05);
        };
        place(me.current, g.p[0], g.p[1], g.p[2], g.mode !== 'spill');
        place(pope.current, g.pope[0], g.pope[1], g.pope[2], g.popeActive);
    });
    return (
        <group>
            <mesh ref={me} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
                <circleGeometry args={[0.36, 20]} />
                <meshBasicMaterial color="#2a1c10" transparent opacity={0.5} depthWrite={false} />
            </mesh>
            <mesh ref={pope} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
                <circleGeometry args={[0.36, 20]} />
                <meshBasicMaterial color="#2a1c10" transparent opacity={0.5} depthWrite={false} />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Funnene: bronsemedaljonger med lapis, som glitrer til de er tatt. Tatt: spretter, snurrer
// fort, blåses opp og krymper inn (på vei inn i kista).
// ---------------------------------------------------------------------------

const MEDAL_RIM = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 18);
MEDAL_RIM.rotateX(Math.PI / 2);
const MEDAL_CORE = new THREE.CylinderGeometry(0.17, 0.17, 0.075, 16);
MEDAL_CORE.rotateX(Math.PI / 2);

export function Finds({ gRef, L, fx }: { gRef: GRef; L: Level; fx: FxPool }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const halo = useRef<(THREE.Mesh | null)[]>([]);
    const sparkT = useRef(0);
    const rim = useMemo(() => new THREE.MeshToonMaterial({ color: '#c08a3e', emissive: new THREE.Color('#6a4210'), gradientMap: toonGradientMap() }), []);
    const core = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(ART.lapis).multiplyScalar(1.3), toneMapped: false }), []);
    useFrame((state, rawDt) => {
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        sparkT.current += rawDt;
        const spark = sparkT.current > 0.6;
        if (spark) sparkT.current = 0;
        L.finds.forEach((f, i) => {
            const m = refs.current[i];
            const h = halo.current[i];
            if (!m) return;
            if (!g.finds[i]) {
                m.visible = true;
                m.position.set(f.p[0], f.p[1] + Math.sin(t * 3 + i) * 0.12, f.p[2]);
                m.rotation.y = t * 2 + i;
                m.scale.setScalar(1);
                if (h) {
                    h.visible = true;
                    h.position.copy(m.position);
                    h.scale.setScalar(1.3 + Math.sin(t * 4 + i) * 0.15);
                }
                if (spark && Math.hypot(g.p[0] - f.p[0], g.p[1] - f.p[1], g.p[2] - f.p[2]) < 14)
                    fx.burst('sparkle', [f.p[0], f.p[1], f.p[2]], 1, 0.4);
                return;
            }
            if (h) h.visible = false;
            const s = g.t - g.findT[i];
            if (s > 0.9 || s < 0) {
                m.visible = false;
                return;
            }
            m.visible = true;
            const hop = 1.8 * s - 1.4 * s * s;
            m.position.set(f.p[0], f.p[1] + hop, f.p[2]);
            m.rotation.y = t * 2 + i + s * 25;
            const k = s < 0.25 ? 1 + s * 3 : Math.max(0.01, 1.75 * (1 - (s - 0.25) / 0.65));
            m.scale.setScalar(k);
        });
    });
    return (
        <group>
            {L.finds.map((f, i) => (
                <group key={f.id}>
                    <group ref={(el) => void (refs.current[i] = el)}>
                        <mesh geometry={MEDAL_RIM} material={rim} />
                        <mesh geometry={MEDAL_CORE} material={core} />
                    </group>
                    <mesh ref={(el) => void (halo.current[i] = el)} renderOrder={7}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial map={soft()} color="#ffd98a" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
                    </mesh>
                </group>
            ))}
            <HaloFacer refs={halo} />
        </group>
    );
}

/** Glorien rundt funnene snur seg alltid mot kameraet. */
function HaloFacer({ refs }: { refs: React.MutableRefObject<(THREE.Mesh | null)[]> }) {
    useFrame(({ camera }) => {
        refs.current.forEach((m) => m?.quaternion.copy(camera.quaternion));
    });
    return null;
}

// ---------------------------------------------------------------------------
// Sjekkpunktene: vimpel på stang og et kalkkar med fersk puss (giornata). Vimpelen blafrer og
// blir gull når du er der; kalken i neste kar lyser svakt, så du ser hvor fersk puss venter.
// ---------------------------------------------------------------------------

const TUB_MAT = toon({ color: '#7a5431', side: THREE.DoubleSide });
const HOOP_MAT = toon({ color: '#3b3632' });
const TUB_GEO = new THREE.CylinderGeometry(0.42, 0.34, 0.5, 12, 1, true);
const HOOP_GEO = new THREE.TorusGeometry(0.4, 0.025, 4, 14);
const LIME_GEO = new THREE.CircleGeometry(0.4, 14);
const HEAP_GEO = new THREE.SphereGeometry(0.22, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);

export function Checkpoints({ gRef, L }: { gRef: GRef; L: Level }) {
    const flags = useRef<(THREE.Group | null)[]>([]);
    const limes = useRef<(THREE.Group | null)[]>([]);
    const mats = useMemo(() => L.checkpoints.map(() => toon({ color: ART.lapis, side: THREE.DoubleSide })), [L]);
    const limeMats = useMemo(
        () => L.checkpoints.map(() => toon({ color: '#f4efe2', emissive: new THREE.Color('#000000') })),
        [L]
    );
    useFrame((state) => {
        const g = gRef.current;
        const hide = g.ch === 'utenCp';
        const t = state.clock.elapsedTime;
        flags.current.forEach((m, i) => {
            if (!m) return;
            (mats[i] as THREE.MeshToonMaterial).color.set(!hide && i <= g.cp ? ART.gold : ART.lapis);
            m.rotation.y = Math.sin(t * 3 + i) * 0.25;
        });
        limes.current.forEach((m, i) => {
            if (!m) return;
            const next = i === g.cp + 1 && !g.ended;
            const lm = limeMats[i] as THREE.MeshToonMaterial;
            // Neste kar lyser svakt; karet du nettopp fylte fra, er nesten tomt.
            lm.emissive.setRGB(next ? 0.25 + 0.15 * Math.sin(t * 4) : 0, next ? 0.22 + 0.13 * Math.sin(t * 4) : 0, next ? 0.12 : 0);
            m.position.y = i <= g.cp ? -0.18 : Math.sin(t * 2 + i) * 0.015;
        });
    });
    const side = L.mirror ? -1 : 1;
    return (
        <group>
            {L.checkpoints.slice(1).map((c, k) => {
                const wz = c.p[2] > 0 ? 0.2 : -0.2;
                return (
                    <group key={k} position={[c.p[0] + 0.9 * side, c.p[1], c.p[2] + wz]}>
                        <mesh position={[0, 0.85, 0]} material={IRON_MAT}>
                            <cylinderGeometry args={[0.03, 0.03, 1.7, 5]} />
                        </mesh>
                        <group ref={(el) => void (flags.current[k + 1] = el)} position={[0, 1.45, 0]}>
                            <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.2]} material={mats[k + 1]}>
                                <coneGeometry args={[0.2, 0.6, 4]} />
                            </mesh>
                        </group>
                        {/* Kalkkaret: trekar med jernbånd, full av hvit, våt kalk */}
                        <group position={[0.55 * side, 0, wz * 0.5]}>
                            <mesh position={[0, 0.25, 0]} geometry={TUB_GEO} material={TUB_MAT} />
                            <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={HOOP_GEO} material={HOOP_MAT} />
                            <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={HOOP_GEO} material={HOOP_MAT} />
                            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={TUB_MAT}>
                                <circleGeometry args={[0.34, 12]} />
                            </mesh>
                            <group ref={(el) => void (limes.current[k + 1] = el)}>
                                <mesh position={[0, 0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={LIME_GEO} material={limeMats[k + 1]} />
                                <mesh position={[0.06, 0.43, -0.05]} scale={[1, 0.45, 1]} geometry={HEAP_GEO} material={limeMats[k + 1]} />
                            </group>
                            {/* Murskjeia står i kalken */}
                            <mesh position={[-0.12, 0.62, 0.08]} rotation={[0.3, 0, 0.35]} material={TUB_MAT}>
                                <boxGeometry args={[0.05, 0.5, 0.05]} />
                            </mesh>
                        </group>
                    </group>
                );
            })}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Puss-klokka i taket: dagens felt tørker fra kantene og innover. I mål: dagens skapelsesbilde.
// ---------------------------------------------------------------------------

/** Sprekker i pussen som tørker: mørke, forgreinede streker på gjennomsiktig bunn. */
function paintCracks(): THREE.CanvasTexture {
    const S = 256;
    const { c, ctx } = makeCanvas(S, S);
    const r = rng(77);
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(70,52,34,.85)';
    ctx.lineCap = 'round';
    const crack = (x: number, y: number, a: number, len: number, wd: number, depth: number) => {
        ctx.lineWidth = wd;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
            a += (r() - 0.5) * 0.9;
            x += Math.cos(a) * (len / 6);
            y += Math.sin(a) * (len / 6);
            ctx.lineTo(x, y);
            if (depth > 0 && r() < 0.3) crack(x, y, a + (r() < 0.5 ? 0.9 : -0.9), len * 0.5, wd * 0.6, depth - 1);
        }
        ctx.stroke();
    };
    for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + r() * 0.4;
        crack(S / 2 + Math.cos(a) * S * 0.46, S / 2 + Math.sin(a) * S * 0.46, a + Math.PI, S * 0.4, 2.4, 2);
    }
    return toTexture(c);
}

/** Penselstrøk-maske: feltet males fra den ene kanten til den andre i brede, ujevne strøk. */
function paintStrokeMask(): THREE.CanvasTexture {
    const W = 128;
    const H = 110;
    const { c, ctx } = makeCanvas(W, H);
    const r = rng(9);
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
        const band = Math.floor(y / 11);
        const wob = (r() - 0.5) * 0.04 + Math.sin(band * 2.3) * 0.05;
        for (let x = 0; x < W; x++) {
            // 1 der penselen kommer først (venstre), 0 der den kommer sist; strøkene går i bånd
            const u = 1 - x / W + wob + (band % 2 ? 0.03 : -0.03);
            const v = Math.max(0, Math.min(255, Math.round((0.04 + u * 0.92) * 255)));
            const i = (y * W + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
}

const WET_COLOR = new THREE.Color('#ffffff');
const DRY_COLOR = new THREE.Color('#e7b89c');

/**
 * Dagens felt i taket: puss-klokka. Den våte flekken krymper fra kantene; de siste 25 %
 * skifter den farge og sprekker, og de siste 10 sekundene pulserer den. I mål maler mesteren
 * dagens skapelsesbilde (`panel`) inn i feltet med brede strøk.
 */
export function CeilingClock({ gRef, L, panel }: { gRef: GRef; L: Level; panel: number }) {
    const wet = useRef<THREE.Mesh>(null);
    const painted = useRef<THREE.Mesh>(null);
    const cracks = useRef<THREE.Mesh>(null);
    const winT = useRef(-1);
    const tex = useMemo(() => {
        const { c, ctx } = makeCanvas(512, 440);
        paintPanel(ctx, panel, 0, 0, 512, 440);
        return { art: toTexture(c), patch: paintWetPatch(), cracks: paintCracks(), mask: paintStrokeMask() };
    }, [panel]);
    useEffect(
        () => () => {
            tex.art.dispose();
            tex.patch.dispose();
            tex.cracks.dispose();
            tex.mask.dispose();
        },
        [tex]
    );
    useFrame((state, rawDt) => {
        const g = gRef.current;
        // Etappe-klokka (giornata): feltet er vått igjen etter hvert kalkkar.
        const left = Math.max(0, g.etLen - g.etT);
        const k = Math.max(0.02, left / g.etLen);
        const w = wet.current;
        if (w) {
            w.scale.set(k, k, 1);
            const m = w.material as THREE.MeshBasicMaterial;
            // De siste 35 %: pussen blir blek og rødbrun; i panikken pulserer den.
            const dry = g.ended === 'vunnet' ? 0 : Math.max(0, Math.min(1, (0.35 - k) / 0.28));
            m.color.copy(WET_COLOR).lerp(DRY_COLOR, dry);
            if (left < panicLen(g) && !g.ended) m.color.multiplyScalar(0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 9));
        }
        const cm = cracks.current;
        if (cm) {
            const u = g.ended === 'vunnet' ? 0 : Math.max(0, Math.min(1, (0.35 - k) / 0.3));
            cm.visible = u > 0;
            (cm.material as THREE.MeshBasicMaterial).opacity = u;
            const s = 0.35 + 0.65 * k + 0.1;
            cm.scale.set(s, s, 1);
        }
        if (g.ended === 'vunnet') winT.current = winT.current < 0 ? 0 : winT.current + Math.min(0.05, rawDt);
        else winT.current = -1;
        const m = painted.current;
        if (m) {
            const u = winT.current < 0 ? 0 : Math.max(0, Math.min(1, (winT.current - PAINT_START) / PAINT_DUR));
            m.visible = winT.current >= PAINT_START;
            // Strøkene kommer fram der masken er høyest først (alphaTest = hvor langt penselen er).
            (m.material as THREE.MeshBasicMaterial).alphaTest = Math.max(0.001, 1 - u * 1.02);
            if (wet.current) wet.current.visible = u < 1;
        }
    });
    return (
        <group position={L.field} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
                <planeGeometry args={[7.4, 6.4]} />
                <meshBasicMaterial color={ART.travDark} />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
                <planeGeometry args={[7, 6]} />
                <meshBasicMaterial color="#f6efdd" />
            </mesh>
            <mesh ref={wet} position={[0, 0, 0.01]}>
                <planeGeometry args={[7, 6]} />
                <meshBasicMaterial map={tex.patch} transparent depthWrite={false} />
            </mesh>
            <mesh ref={cracks} position={[0, 0, 0.012]} visible={false}>
                <planeGeometry args={[7, 6]} />
                <meshBasicMaterial map={tex.cracks} transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh ref={painted} position={[0, 0, 0.015]} visible={false}>
                <planeGeometry args={[7, 6]} />
                <meshBasicMaterial map={tex.art} alphaMap={tex.mask} alphaTest={1} toneMapped={false} />
            </mesh>
        </group>
    );
}

/** Utfordringen «Stigende slam»: kalkslammet stiger fra gulvet. */
export function Slam({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.Mesh>(null);
    const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: PAL.slam, emissive: new THREE.Color('#3a342a'), transparent: true, opacity: 0.9 }), []);
    useFrame((state) => {
        const g = gRef.current;
        const m = ref.current;
        if (!m) return;
        m.visible = g.ch === 'slam';
        m.position.y = Math.max(0.02, g.slam) + Math.sin(state.clock.elapsedTime * 2) * 0.03;
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} material={mat}>
            <planeGeometry args={[ROOM.x1 - ROOM.x0, ROOM.z1 - ROOM.z0, 1, 1]} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Neste mål: en søyle av lys og en pil over neste kalkkar (til slutt over mesteren).
// Eleven skal se hvor bøtta skal uten å lese noe. Den trygge veien dit må eleven fortsatt finne
// selv; lyset sier bare «hit».
// ---------------------------------------------------------------------------

let BEAM_TEX: THREE.CanvasTexture | null = null;
function beamTex() {
    if (BEAM_TEX) return BEAM_TEX;
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 128;
    const x = c.getContext('2d')!;
    const gr = x.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,226,140,0)');
    gr.addColorStop(0.55, 'rgba(255,214,110,0.35)');
    gr.addColorStop(1, 'rgba(255,200,80,0.8)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 4, 128);
    BEAM_TEX = new THREE.CanvasTexture(c);
    return BEAM_TEX;
}

const BEAM_H = 7;
let BEAM_MAT: THREE.MeshBasicMaterial | null = null;
const beamMaterial = () =>
    (BEAM_MAT ??= new THREE.MeshBasicMaterial({
        map: beamTex(),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
    }));
const ARROW_MAT = toon({ color: ART.gold, emissive: new THREE.Color('#6a4a10') });

export function NextBeacon({ gRef }: { gRef: GRef }) {
    const root = useRef<THREE.Group>(null);
    const arrow = useRef<THREE.Group>(null);
    const fade = useRef(0);
    useFrame((state, rawDt) => {
        const g = gRef.current;
        const r = root.current;
        if (!r) return;
        const dt = Math.min(0.05, rawDt);
        const q = nextGoal(g);
        P1.set(q[0], q[1], q[2]);
        const near = Math.hypot(g.p[0] - P1.x, g.p[2] - P1.z) < 2.6 && Math.abs(g.p[1] - P1.y) < 1.6;
        const want = g.ended || near ? 0 : 1;
        fade.current += (want - fade.current) * Math.min(1, dt * 4);
        r.visible = fade.current > 0.02;
        r.position.copy(P1);
        const t = state.clock.elapsedTime;
        beamMaterial().opacity = fade.current * (0.75 + 0.2 * Math.sin(t * 3));
        if (arrow.current) {
            arrow.current.position.y = 2.6 + Math.sin(t * 4) * 0.22;
            arrow.current.rotation.y = t * 1.6;
            arrow.current.scale.setScalar(fade.current);
        }
    });
    return (
        <group ref={root}>
            <mesh position={[0, BEAM_H / 2, 0]} material={beamMaterial()} renderOrder={5}>
                <cylinderGeometry args={[0.55, 0.55, BEAM_H, 16, 1, true]} />
            </mesh>
            <group ref={arrow}>
                <mesh rotation={[Math.PI, 0, 0]} material={ARROW_MAT}>
                    <coneGeometry args={[0.32, 0.6, 4]} />
                </mesh>
                <mesh position={[0, 0.5, 0]} material={ARROW_MAT}>
                    <boxGeometry args={[0.16, 0.5, 0.16]} />
                </mesh>
            </group>
        </group>
    );
}
