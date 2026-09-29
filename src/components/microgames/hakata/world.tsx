import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit/quality';
import { SEC_X, SECTIONS, SLOTS, slotX, wind, BEHIND_JUMP, type G } from './game';
import {
    LADDER_LEN,
    PARAPET_Y,
    WALK_Y,
    WATER_Y,
    BEACH_Y,
    CHAMP_Z,
    PAL,
    ladderAngle,
    ladderBase,
    ladderPoint,
    wallManPos,
} from './geo';
import {
    inkMaterial,
    outlineGeo,
    toonVC,
    waveTexture,
    sandTexture,
    stoneTexture,
    goldCloudTexture,
    mergeLit,
} from './look';

// 3D-scenen for Guddommelig vind: bukta, muren, stigene, mongolene og flåten, i
// looken fra mongolinvasjonsrullen - flate mineralfarger med tusjkontur, bølgelinjer
// og gullskyer. All spilltilstand leses fra gRef i useFrame; ingenting her setter
// React-state per bilde, og ingen materialer byttes underveis (ingen shader-kompilering).

type GRef = React.MutableRefObject<G>;

const tmpObj = new THREE.Object3D();
const V = new THREE.Vector3();
const V2 = new THREE.Vector3();
const C = new THREE.Color();

// ---------------------------------------------------------------------------
// Lys og himmel
// ---------------------------------------------------------------------------

const SKY = new THREE.Color(PAL.paper);
const STORM_SKY = new THREE.Color('#58605d');

export function Lights({ gRef }: { gRef: GRef }) {
    const hemi = useRef<THREE.HemisphereLight>(null);
    const sun = useRef<THREE.DirectionalLight>(null);
    useFrame((state) => {
        const g = gRef.current;
        const w = wind(g);
        const storm = g.storm >= 0 ? Math.min(1, g.storm / 1.5) : 0;
        const dark = Math.min(1, w * w * 0.35 + storm * 0.65);
        const bg = state.scene.background;
        if (bg instanceof THREE.Color) bg.copy(SKY).lerp(STORM_SKY, dark);
        if (state.scene.fog) state.scene.fog.color.copy(SKY).lerp(STORM_SKY, dark);
        // Lyn i stormen.
        const flash = g.storm >= 0 && Math.sin(g.storm * 7.3) > 0.96 ? 1.8 : 0;
        if (hemi.current) hemi.current.intensity = 1.9 - dark * 0.8 + flash;
        if (sun.current) sun.current.intensity = 1.2 - dark * 0.9;
    });
    return (
        <>
            <hemisphereLight ref={hemi} args={['#fff8ea', '#b9ac93', 1.9]} />
            <directionalLight ref={sun} position={[-6, 12, 9]} intensity={1.2} color="#fff3dc" />
        </>
    );
}

// ---------------------------------------------------------------------------
// Havet med bølgelinjer, stranda, muren
// ---------------------------------------------------------------------------

const SEA_COL = new THREE.Color('#ffffff');
const SEA_STORM = new THREE.Color('#7d8c88');

/** Bølgene: høyere og raskere jo sterkere vinden er. (Modulfunksjon - muterer geometrien.) */
function waveSea(geo: THREE.BufferGeometry, base: Float32Array, t: number, w: number) {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const amp = 0.06 + w * 0.5;
    for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        const z = base[i * 3 + 2];
        pos.setY(i, Math.sin(x * 0.35 + t * (1.2 + w)) * amp + Math.cos(z * 0.5 - t * 1.6) * amp * 0.7);
    }
    pos.needsUpdate = true;
}

function scrollWaves(mat: THREE.MeshToonMaterial, dt: number, w: number, storm: number) {
    const map = mat.map;
    if (map) {
        map.offset.x += dt * (0.004 + w * 0.03);
        map.offset.y += dt * (0.01 + w * 0.05);
    }
    mat.color.copy(SEA_COL).lerp(SEA_STORM, Math.min(1, w * w * 0.3 + storm * 0.7));
}

export function Sea({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshToonMaterial>(null);
    const geo = useMemo(() => {
        const g = new THREE.PlaneGeometry(260, 140, 56, 30);
        g.rotateX(-Math.PI / 2);
        g.translate(0, 0, -66);
        return g;
    }, []);
    const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
    const map = useMemo(() => {
        const t = waveTexture().clone();
        t.repeat.set(42, 22);
        t.needsUpdate = true;
        return t;
    }, []);
    useFrame((state, dt) => {
        const g = gRef.current;
        const w = wind(g) + (g.storm >= 0 ? 0.8 : 0);
        waveSea(geo, base, state.clock.elapsedTime, w);
        if (matRef.current) scrollWaves(matRef.current, Math.min(0.05, dt), w, g.storm >= 0 ? 1 : 0);
    });
    return (
        <mesh ref={ref} geometry={geo} position={[0, WATER_Y, 0]}>
            <meshToonMaterial ref={matRef} map={map} />
        </mesh>
    );
}

export function Shore() {
    const sand = useMemo(() => {
        const t = sandTexture().clone();
        t.repeat.set(14, 1);
        t.needsUpdate = true;
        return t;
    }, []);
    const stone = useMemo(() => {
        const t = stoneTexture().clone();
        t.repeat.set(20, 1.4);
        t.needsUpdate = true;
        return t;
    }, []);
    return (
        <group>
            {/* Stranda foran muren */}
            <mesh position={[0, BEACH_Y - 0.25, -1.75]}>
                <boxGeometry args={[46, 0.5, 2.9]} />
                <meshLambertMaterial map={sand} />
            </mesh>
            {/* Murens forside (sees fra stranda i tvekampen) */}
            <mesh position={[0, (WALK_Y + BEACH_Y) / 2, -0.32]}>
                <boxGeometry args={[46, WALK_Y - BEACH_Y, 0.08]} />
                <meshLambertMaterial map={stone} />
            </mesh>
            {/* Gangveien på toppen */}
            <mesh position={[0, WALK_Y - 0.2, 1.3]}>
                <boxGeometry args={[46, 0.4, 3.2]} />
                <meshLambertMaterial map={stone} />
            </mesh>
            {/* Lav steinkant ut mot sjøen, med tusjstrek */}
            <mesh position={[0, (PARAPET_Y + WALK_Y) / 2, -0.15]}>
                <boxGeometry args={[46, PARAPET_Y - WALK_Y, 0.38]} />
                <meshLambertMaterial color="#8c806c" />
            </mesh>
            <mesh position={[0, PARAPET_Y + 0.01, -0.34]}>
                <boxGeometry args={[46, 0.03, 0.04]} />
                <meshBasicMaterial color={PAL.ink} />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Gullskyene over bukta (rullens kasumi)
// ---------------------------------------------------------------------------

const CLOUDS: [number, number, number, number][] = [
    [-14, -0.2, -26, 22],
    [11, 0.4, -34, 26],
    [-4, 1.2, -52, 34],
    [22, 1.6, -62, 30],
    [-30, 1.0, -44, 28],
];

function fadeClouds(mat: THREE.MeshBasicMaterial, o: number) {
    mat.opacity = o;
}

export function GoldClouds({ gRef }: { gRef: GRef }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const mat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                map: goldCloudTexture(),
                transparent: true,
                depthWrite: false,
                fog: false,
            }),
        []
    );
    useFrame((state) => {
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        const w = wind(g);
        refs.current.forEach((m, i) => {
            if (!m) return;
            const [x] = CLOUDS[i];
            m.position.x = x + Math.sin(t * 0.05 + i) * 3 + t * w * 0.4 * (i % 2 ? 1 : -1) % 30;
        });
        fadeClouds(mat, g.storm >= 0 ? Math.max(0, 1 - g.storm / 1.5) : 1 - w * 0.25);
    });
    return (
        <>
            {CLOUDS.map(([x, y, z, s], i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    position={[x, WATER_Y + 2 + y, z]}
                    rotation={[-0.35, 0, 0]}
                    material={mat}
                >
                    <planeGeometry args={[s, s / 4]} />
                </mesh>
            ))}
        </>
    );
}

// ---------------------------------------------------------------------------
// Flåten ute i bukta
// ---------------------------------------------------------------------------

const SHIP_GEO = mergeLit([
    { geometry: new THREE.BoxGeometry(1.8, 0.9, 5.6), position: [0, 0.2, 0], color: '#9a7650' },
    { geometry: new THREE.BoxGeometry(1.9, 0.18, 5.8), position: [0, 0.68, 0], color: '#6b5236' },
    { geometry: new THREE.BoxGeometry(1.3, 0.8, 1.7), position: [0, 1.05, -1.7], color: '#a8432f' },
    { geometry: new THREE.CylinderGeometry(0.08, 0.1, 5, 5), position: [0, 3, 0.3], color: '#3b2c21' },
    { geometry: new THREE.BoxGeometry(2.9, 2.8, 0.1), position: [0, 3.5, 0.3], color: '#e6d6ae' },
]);

export function Fleet({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const ink = useRef<THREE.InstancedMesh>(null);
    const q = useQuality();
    const ships = useMemo(() => {
        const out: { x: number; z: number; r: number; s: number; p: number }[] = [];
        let seed = 7;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const n = Math.round(46 + 24 * q.detail);
        for (let i = 0; i < n; i++) {
            const z = -17 - rnd() * 75;
            out.push({ x: (rnd() - 0.5) * (30 + -z * 1.6), z, r: (rnd() - 0.5) * 0.8, s: 0.8 + rnd() * 0.6, p: rnd() * 6 });
        }
        return out;
    }, [q.detail]);
    useFrame((state) => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        const w = wind(g);
        ships.forEach((s, i) => {
            // Tyfonen: skipene krenger, knuses og synker ett og ett.
            const sinkAt = (i % 14) * 0.3;
            const k = g.storm >= 0 ? Math.max(0, Math.min(1, (g.storm - sinkAt) / 2.2)) : 0;
            const roll = Math.sin(t * (1 + w) + s.p) * (0.03 + w * 0.14) + k * 1.3;
            tmpObj.position.set(s.x + k * 3, WATER_Y + 0.1 - k * 5 + Math.sin(t * 1.3 + s.p) * (0.05 + w * 0.35), s.z);
            tmpObj.rotation.set(Math.sin(t * 0.9 + s.p) * w * 0.12 + k * 0.5, s.r, roll);
            tmpObj.scale.setScalar(s.s);
            tmpObj.updateMatrix();
            m.setMatrixAt(i, tmpObj.matrix);
            ink.current?.setMatrixAt(i, tmpObj.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
        if (ink.current) ink.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={ref} args={[SHIP_GEO, toonVC(), ships.length]} frustumCulled={false} />
            <instancedMesh
                ref={ink}
                args={[outlineGeo(SHIP_GEO), inkMaterial(0.06), ships.length]}
                frustumCulled={false}
            />
        </>
    );
}

// ---------------------------------------------------------------------------
// Stigene og småbåtene de står i
// ---------------------------------------------------------------------------

const LADDER_GEO = (() => {
    const parts = [
        { geometry: new THREE.BoxGeometry(0.1, LADDER_LEN, 0.1), position: [-0.34, LADDER_LEN / 2, 0] as [number, number, number], color: '#6b4a2b' },
        { geometry: new THREE.BoxGeometry(0.1, LADDER_LEN, 0.1), position: [0.34, LADDER_LEN / 2, 0] as [number, number, number], color: '#6b4a2b' },
        // Krokene som hekter stigen til muren.
        { geometry: new THREE.BoxGeometry(0.08, 0.08, 0.35), position: [-0.34, LADDER_LEN, 0.15] as [number, number, number], color: '#2a2622' },
        { geometry: new THREE.BoxGeometry(0.08, 0.08, 0.35), position: [0.34, LADDER_LEN, 0.15] as [number, number, number], color: '#2a2622' },
    ];
    for (let y = 0.4; y < LADDER_LEN; y += 0.45)
        parts.push({ geometry: new THREE.BoxGeometry(0.7, 0.06, 0.07), position: [0, y, 0], color: '#a07a4c' });
    return mergeLit(parts);
})();
const LADDER_INK = outlineGeo(LADDER_GEO);

const BOAT_GEO = mergeLit([
    { geometry: new THREE.BoxGeometry(1.2, 0.45, 2.6), position: [0, 0.05, -0.6], color: '#a07c52' },
    { geometry: new THREE.BoxGeometry(1.3, 0.1, 2.7), position: [0, 0.3, -0.6], color: '#4d3a26' },
]);
const BOAT_INK = outlineGeo(BOAT_GEO);

export function Ladders({ gRef }: { gRef: GRef }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    const boats = useRef<(THREE.Group | null)[]>([]);
    useFrame((state) => {
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        const w = wind(g);
        const seen = new Array(SECTIONS * SLOTS).fill(false);
        for (const l of g.ladders) {
            const i = l.sec * SLOTS + l.slot;
            const m = refs.current[i];
            const b = boats.current[i];
            seen[i] = true;
            if (m) {
                m.visible = true;
                ladderBase(l, m.position);
                m.rotation.set(ladderAngle(l, t), 0, 0);
            }
            if (b) {
                b.visible = true;
                b.position.set(slotX(l.sec, l.slot), WATER_Y + 0.05 + Math.sin(t * 1.7 + i) * (0.04 + w * 0.12), -6.3);
                b.rotation.z = Math.sin(t * 1.3 + i) * (0.03 + w * 0.08);
            }
        }
        seen.forEach((s, i) => {
            if (s) return;
            if (refs.current[i]) refs.current[i]!.visible = false;
            if (boats.current[i]) boats.current[i]!.visible = false;
        });
    });
    return (
        <>
            {Array.from({ length: SECTIONS * SLOTS }, (_, i) => (
                <group key={i}>
                    <group
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                        visible={false}
                    >
                        <mesh geometry={LADDER_GEO} material={toonVC()} />
                        <mesh geometry={LADDER_INK} material={inkMaterial(0.025)} />
                    </group>
                    <group
                        ref={(el) => {
                            boats.current[i] = el;
                        }}
                        visible={false}
                    >
                        <mesh geometry={BOAT_GEO} material={toonVC()} />
                        <mesh geometry={BOAT_INK} material={inkMaterial(0.04)} />
                    </group>
                </group>
            ))}
        </>
    );
}

// ---------------------------------------------------------------------------
// Mongolene: på stigene, på muren, i sjøen, fallende - og flokken ved tvekampen
// ---------------------------------------------------------------------------

const MAN_GEO = mergeLit([
    { geometry: new THREE.BoxGeometry(0.52, 0.75, 0.34), position: [0, 0.95, 0], color: '#2f4f82' },
    { geometry: new THREE.BoxGeometry(0.56, 0.12, 0.38), position: [0, 0.62, 0], color: '#c9a24a' },
    { geometry: new THREE.BoxGeometry(0.42, 0.55, 0.28), position: [0, 0.3, 0], color: '#3a3024' },
    { geometry: new THREE.SphereGeometry(0.17, 8, 6), position: [0, 1.5, 0.02], color: '#e2c196' },
    { geometry: new THREE.ConeGeometry(0.24, 0.34, 8), position: [0, 1.74, 0], color: '#6b5a3a' },
    { geometry: new THREE.CylinderGeometry(0.26, 0.26, 0.07, 8), position: [0, 1.6, 0], color: '#8a6d3e' },
    // Det runde skjoldet på armen: vermilion med gullbukkel.
    { geometry: new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), position: [-0.32, 1.0, 0.2], rotation: [Math.PI / 2, 0, 0.3], color: PAL.red },
    { geometry: new THREE.SphereGeometry(0.07, 6, 5), position: [-0.34, 1.0, 0.25], color: PAL.gold },
]);
const MAN_INK = outlineGeo(MAN_GEO);
const MAX_MEN = 110;
const MAX_DANGER = 12;

export function Men({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const ink = useRef<THREE.InstancedMesh>(null);
    const red = useRef<THREE.InstancedMesh>(null);
    useFrame((state) => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        let n = 0;
        let nr = 0;
        const put = (x: number, y: number, z: number, rx: number, ry: number, rz = 0, s = 1, danger = false) => {
            if (n >= MAX_MEN) return;
            tmpObj.position.set(x, y, z);
            tmpObj.rotation.set(rx, ry, rz);
            tmpObj.scale.setScalar(s);
            tmpObj.updateMatrix();
            m.setMatrixAt(n, tmpObj.matrix);
            ink.current?.setMatrixAt(n, tmpObj.matrix);
            n++;
            if (danger && red.current && nr < MAX_DANGER) red.current.setMatrixAt(nr++, tmpObj.matrix);
        };
        for (const l of g.ladders) {
            if (l.state === 'faller' && l.fallT > 0.5) continue;
            const a = ladderAngle(l, t);
            l.men.forEach((p, k) => {
                if (k === 0 && l.top >= 0) {
                    wallManPos(l, V);
                    // Han hugger mot deg når slaget kommer.
                    const lunge = l.hitT < 0.3 ? (0.3 - l.hitT) * 1.4 : 0;
                    put(V.x, V.y, V.z + lunge, -0.15 - lunge * 0.9, 0, Math.sin(t * 6) * 0.05);
                    return;
                }
                ladderPoint(l, p * LADDER_LEN * 0.92, 0.3, t, V);
                // Rødt omriss: han er så nær at han hopper over hvis mannen foran ham hugges.
                const danger = k >= 1 && l.top < 0 && p >= BEHIND_JUMP - 0.04 && l.state !== 'faller';
                put(V.x + Math.sin(t * 9 + k) * 0.03, V.y - 0.9, V.z, a * 0.8, 0, 0, 1, danger);
            });
        }
        // De som svømmer tilbake til båtene: bare hjelm og hode over vannet.
        g.swim.forEach((left, i) => {
            const k = 1 - left / 12;
            const x = SEC_X[i % SECTIONS] + (((i * 37) % 11) / 11 - 0.5) * 6;
            const z = -6.8 - k * 9 - ((i * 13) % 5) * 0.4;
            put(x, WATER_Y - 2.2 + Math.sin(t * 2 + i) * 0.1, z, 0, Math.PI + Math.sin(i) * 0.5, 0, 1.7);
        });
        // De som er hugget: faller bakover ned fra muren.
        for (const f of g.fx) {
            if (f.kind !== 'mann') continue;
            const k = 1 - f.life / f.max;
            put(f.x, f.y - 1.2 - k * k * 6.5, f.z - k * 2.2, -k * 3.2, 0, k * 0.6);
        }
        // Flokken bak kjempen under tvekampen.
        const d = g.duel;
        if (d && d.phase === 'kamp') {
            const x0 = SEC_X[d.sec];
            const k = Math.min(1, (2.4 - d.flockT) / 2.4 + d.t * 0.2);
            for (let i = 0; i < 9; i++) {
                const ang = (i / 8 - 0.5) * 2.4;
                put(x0 + Math.sin(ang) * (6 - k * 2.5), BEACH_Y, CHAMP_Z - 1.2 - Math.cos(ang) * (3 - k), 0, Math.PI * 0 - ang * 0.6);
            }
        }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
        if (ink.current) {
            ink.current.count = n;
            ink.current.instanceMatrix.needsUpdate = true;
        }
        if (red.current) {
            red.current.count = nr;
            red.current.instanceMatrix.needsUpdate = true;
        }
    });
    return (
        <>
            <instancedMesh ref={ref} args={[MAN_GEO, toonVC(), MAX_MEN]} frustumCulled={false} />
            <instancedMesh ref={ink} args={[MAN_INK, inkMaterial(0.03), MAX_MEN]} frustumCulled={false} />
            <instancedMesh ref={red} args={[MAN_INK, inkMaterial(0.07, '#d6301e'), MAX_DANGER]} frustumCulled={false} />
        </>
    );
}

// ---------------------------------------------------------------------------
// Kjempen som utfordrer til tvekamp
// ---------------------------------------------------------------------------

const CHAMP_GEO = mergeLit([
    { geometry: new THREE.BoxGeometry(0.7, 1.0, 0.42), position: [0, 1.25, 0], color: PAL.red },
    { geometry: new THREE.BoxGeometry(0.74, 0.14, 0.46), position: [0, 0.8, 0], color: PAL.gold },
    { geometry: new THREE.BoxGeometry(0.55, 0.75, 0.36), position: [0, 0.38, 0], color: '#3a3024' },
    { geometry: new THREE.SphereGeometry(0.22, 10, 8), position: [0, 1.95, 0.03], color: '#e2c196' },
    { geometry: new THREE.ConeGeometry(0.3, 0.45, 10), position: [0, 2.25, 0], color: PAL.gold },
    { geometry: new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), position: [0.25, 2.3, -0.2], color: PAL.ink },
    { geometry: new THREE.BoxGeometry(0.05, 1.1, 0.6), position: [0.25, 3.0, -0.52], color: '#f0e4c4' },
    { geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), position: [0.28, 3.05, -0.52], rotation: [0, 0, Math.PI / 2], color: PAL.red },
]);
const CHAMP_INK = outlineGeo(CHAMP_GEO);
const BLADE_GEO = new THREE.BoxGeometry(0.08, 1.3, 0.04);
BLADE_GEO.translate(0, 0.65, 0);
const BLADE_COL = new THREE.Color('#e9e6dc');
const BLADE_HOT = new THREE.Color('#ff5a3c');

export function Champion({ gRef }: { gRef: GRef }) {
    const body = useRef<THREE.Group>(null);
    const arm = useRef<THREE.Group>(null);
    const bladeMat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((state) => {
        const g = gRef.current;
        const d = g.duel;
        const b = body.current;
        if (!b) return;
        b.visible = !!d && g.storm < 0;
        if (!d) return;
        const t = state.clock.elapsedTime;
        const fight = d.phase === 'kamp';
        b.position.set(SEC_X[d.sec], BEACH_Y, fight ? CHAMP_Z : CHAMP_Z - 0.4);
        b.rotation.y = Math.sin(t * 1.3) * 0.06;
        b.scale.setScalar(fight ? 1.15 : 1.05);
        if (arm.current) {
            const target = !fight ? -0.6 + Math.sin(t * 2) * 0.3 : d.champ === 'løfter' ? -2.6 : d.champ === 'åpen' ? 0.9 : -0.4;
            arm.current.rotation.x += (target - arm.current.rotation.x) * 0.25;
        }
        if (bladeMat.current) bladeMat.current.color.copy(fight && d.champ === 'løfter' ? BLADE_HOT : BLADE_COL);
    });
    return (
        <group ref={body} visible={false}>
            <mesh geometry={CHAMP_GEO} material={toonVC()} />
            <mesh geometry={CHAMP_INK} material={inkMaterial(0.035)} />
            <group ref={arm} position={[0.42, 1.55, 0.05]}>
                <mesh geometry={BLADE_GEO} position={[0, 0, 0.1]}>
                    <meshBasicMaterial ref={bladeMat} color="#e9e6dc" toneMapped={false} />
                </mesh>
            </group>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Kruttbomber og pilregn
// ---------------------------------------------------------------------------

export function Bombs({ gRef }: { gRef: GRef }) {
    const refs = useRef<(THREE.Group | null)[]>([]);
    useFrame((state) => {
        const g = gRef.current;
        const t = state.clock.elapsedTime;
        for (let i = 0; i < 6; i++) {
            const o = refs.current[i];
            if (!o) continue;
            const b = g.bombs[i];
            o.visible = !!b;
            if (!b) continue;
            const x = slotX(b.sec, b.slot);
            const land = V2.set(x, PARAPET_Y + 0.25, -0.15);
            if (b.state === 'lufta') {
                const k = Math.min(1, (b.max - b.t) / 0.7);
                o.position.set(x, WATER_Y + (land.y - WATER_Y) * k + Math.sin(k * Math.PI) * 3, -9 + 8.85 * k);
            } else if (b.state === 'ligger') {
                o.position.copy(land);
                o.position.y += Math.abs(Math.sin(t * 20)) * 0.03;
            } else {
                const k = 1 - b.t / 0.6;
                o.position.set(x, land.y + Math.sin(k * Math.PI) * 2.5 - k * 5, -0.15 - k * 8);
            }
            o.rotation.x += 0.2;
            const s = b.state === 'ligger' ? 1 + Math.max(0, 0.8 - b.t) * 0.4 : 1;
            o.scale.setScalar(s);
        }
    });
    return (
        <>
            {Array.from({ length: 6 }, (_, i) => (
                <group
                    key={i}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                    visible={false}
                >
                    <mesh>
                        <sphereGeometry args={[0.24, 12, 10]} />
                        <meshLambertMaterial color="#2a2622" />
                    </mesh>
                    <mesh>
                        <sphereGeometry args={[0.24, 12, 10]} />
                        <primitive object={inkMaterial(0.03)} attach="material" />
                    </mesh>
                    <mesh position={[0, 0.3, 0]}>
                        <sphereGeometry args={[0.08, 6, 5]} />
                        <meshBasicMaterial color="#ffb347" toneMapped={false} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

const ARROWS_PER = 26;
const ARROW_GEO = new THREE.BoxGeometry(0.03, 0.03, 0.9);

export function Arrows({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        let n = 0;
        for (const v of g.volleys) {
            const k = 1 - v.t / v.max;
            if (k < 0.52) continue; // buene spennes først
            const f = (k - 0.52) / 0.48;
            for (let i = 0; i < ARROWS_PER && n < 3 * ARROWS_PER; i++) {
                const ox = ((i * 37) % 13) / 13 - 0.5;
                const oz = ((i * 17) % 7) / 7 - 0.5;
                const drift = v.drift ? f * f * 9 : 0;
                const x = SEC_X[v.sec] + ox * 5 + drift;
                const z = -30 + 32 * f + oz * 2;
                const y = 1 + Math.sin(f * Math.PI) * 9 + f * 2.8;
                tmpObj.position.set(x, y, z);
                tmpObj.lookAt(x + (v.drift ? 1 : 0), y + Math.cos(f * Math.PI) * 0.9, z + 1);
                tmpObj.updateMatrix();
                m.setMatrixAt(n++, tmpObj.matrix);
            }
        }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[ARROW_GEO, undefined, 3 * ARROWS_PER]} frustumCulled={false}>
            <meshBasicMaterial color={PAL.ink} />
        </instancedMesh>
    );
}

/** Buene som spennes på skipet foran deg: varselet om pilregn. */
export function Archers({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((state) => {
        const g = gRef.current;
        const v = g.volleys[0];
        const o = ref.current;
        if (!o) return;
        o.visible = !!v && 1 - v.t / v.max < 0.55;
        if (!v) return;
        o.position.set(SEC_X[v.sec], WATER_Y + 2.2, -13);
        const k = 1 - v.t / v.max;
        o.scale.setScalar(1.4 - k);
        if (mat.current) mat.current.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 18) * 0.4;
    });
    return (
        <mesh ref={ref} visible={false}>
            <torusGeometry args={[2.4, 0.09, 6, 40, Math.PI]} />
            <meshBasicMaterial ref={mat} color={PAL.red} transparent toneMapped={false} fog={false} />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Regn i stormen og små effekter
// ---------------------------------------------------------------------------

const RAIN = 260;
export function Rain({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const q = useQuality();
    const drops = useMemo(
        () => Array.from({ length: RAIN }, (_, i) => [((i * 7919) % 400) / 400, ((i * 104729) % 400) / 400, ((i * 1299709) % 400) / 400]),
        []
    );
    useFrame((state) => {
        const m = ref.current;
        if (!m) return;
        const g = gRef.current;
        const w = wind(g);
        const on = g.storm >= 0 ? 1 : Math.max(0, (w - 0.8) * 3);
        const n = Math.floor(RAIN * Math.min(1, on) * Math.max(0.4, q.particleScale));
        const t = state.clock.elapsedTime;
        const cx = state.camera.position.x;
        for (let i = 0; i < n; i++) {
            const [a, b, c] = drops[i];
            const y = 12 - ((((t * 14 + b * 20) % 20) + 20) % 20);
            tmpObj.position.set(cx + (a - 0.5) * 24 + (12 - y) * 0.4, y - 2, 1 - c * 18);
            tmpObj.rotation.set(0, 0, 0.35);
            tmpObj.updateMatrix();
            m.setMatrixAt(i, tmpObj.matrix);
        }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, RAIN]} frustumCulled={false}>
            <boxGeometry args={[0.02, 0.9, 0.02]} />
            <meshBasicMaterial color="#e8e4da" transparent opacity={0.55} />
        </instancedMesh>
    );
}

const FX_MAX = 40;
const FX_COL: Record<string, string> = {
    gnist: '#ffd27a',
    smell: '#ff8a3c',
    over: PAL.red,
};
const RING_GEO = new THREE.TorusGeometry(0.5, 0.07, 4, 24);
RING_GEO.rotateX(Math.PI / 2);

/** Gnister, smell, plask (hvite ringer på vannet med dråper) og røde glimt når noen kommer over. */
export function FxView({ gRef }: { gRef: GRef }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const rings = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const m = ref.current;
        const r = rings.current;
        if (!m || !r) return;
        const g = gRef.current;
        let n = 0;
        let nr = 0;
        for (const f of g.fx) {
            const k = 1 - f.life / f.max;
            if (f.kind === 'plask') {
                if (nr < FX_MAX) {
                    const s = 0.6 + k * 2.6;
                    tmpObj.position.set(f.x, WATER_Y + 0.25, f.z);
                    tmpObj.rotation.set(0, 0, 0);
                    tmpObj.scale.set(s, 1, s * 0.8);
                    tmpObj.updateMatrix();
                    r.setMatrixAt(nr++, tmpObj.matrix);
                }
                // Dråper som spruter opp.
                for (let d = 0; d < 5 && n < FX_MAX; d++) {
                    const a = d * 1.26;
                    const h = Math.sin(Math.min(1, k * 1.6) * Math.PI) * (1.2 + (d % 2) * 0.6);
                    tmpObj.position.set(f.x + Math.cos(a) * k * 1.2, WATER_Y + 0.3 + h, f.z + Math.sin(a) * k * 0.8);
                    tmpObj.scale.setScalar(0.16 * (1 - k * 0.6));
                    tmpObj.updateMatrix();
                    m.setMatrixAt(n, tmpObj.matrix);
                    m.setColorAt(n, C.set('#f7f3e8'));
                    n++;
                }
                continue;
            }
            if (n >= FX_MAX || !(f.kind in FX_COL)) continue;
            const s = f.kind === 'smell' ? 0.3 + k * 2.2 : f.kind === 'over' ? 0.35 * (1 - k) : 0.25 + k * 0.6;
            tmpObj.position.set(f.x, f.y + (f.kind === 'over' ? k * 1.2 : 0), f.z);
            tmpObj.scale.setScalar(s);
            tmpObj.rotation.set(k, k * 2, 0);
            tmpObj.updateMatrix();
            m.setMatrixAt(n, tmpObj.matrix);
            m.setColorAt(n, C.set(FX_COL[f.kind]));
            n++;
        }
        m.count = n;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
        r.count = nr;
        r.instanceMatrix.needsUpdate = true;
    });
    return (
        <>
            <instancedMesh ref={ref} args={[undefined, undefined, FX_MAX]} frustumCulled={false}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={rings} args={[RING_GEO, undefined, FX_MAX]} frustumCulled={false}>
                <meshBasicMaterial color="#f7f3e8" toneMapped={false} />
            </instancedMesh>
        </>
    );
}
