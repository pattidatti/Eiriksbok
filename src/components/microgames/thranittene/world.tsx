import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
    PLACES,
    PRESS_POS,
    NORWAY,
    SWEDEN,
    JUTLAND,
    BORDER,
    heightAt,
    landAt,
    mountainAt,
    groundY,
    type XZ,
} from './geo';
import { bundlePos, letterPos, snowOf, type G, type Fx, type Mode } from './game';
import {
    seaTexture,
    paperTexture,
    labelAtlas,
    LABEL_COLS,
    annonseTexture,
    mapLabel,
    pressSign,
    INK,
    RED,
} from './textures';
import { mergeParts } from '../kit/mergeParts';
import { useQuality } from '../kit/quality';

// 3D-scenen for Thranittene: et kart av Sør-Norge som et kobberstikk, bygdene med
// ringer, flagg og folk, trykkeriet i Christiania og buntene som flyr. All
// spilltilstand leses fra gRef i useFrame - ingenting her setter React-state.

type GRef = React.MutableRefObject<G>;

const tmpObj = new THREE.Object3D();
const tmpCol = new THREE.Color();
const tmpV: [number, number, number] = [0, 0, 0];

// Farger og bakkehøyder regnes én gang - ikke per bilde (Chromebook-budsjettet).
const lin = (h: string) => new THREE.Color(h).convertSRGBToLinear();
const COL_RED = new THREE.Color(RED);
const COL_COAT = new THREE.Color('#2a241d');
const COL_GUEST = new THREE.Color('#4a4236');
const RING_RED = lin(RED);
const RING_MEET = lin('#e0962b');
const RING_FEAR = lin('#6b6257');
const RING_AD = lin('#0c0a08');
const VILLAGE_Y = PLACES.map((p) => groundY(p.pos));
const PRESS_Y = groundY(PRESS_POS);

// ---------------------------------------------------------------------------
// Lys og himmel
// ---------------------------------------------------------------------------

const SKY_SUMMER = new THREE.Color('#e9dfc4');
const SKY_WINTER = new THREE.Color('#e3e3dc');

export function Atmosphere({ gRef }: { gRef: GRef }) {
    const scene = useThree((s) => s.scene);
    const sun = useRef<THREE.DirectionalLight>(null);
    const col = useMemo(() => new THREE.Color(), []);
    useFrame(() => {
        const s = snowOf(gRef.current.t);
        col.copy(SKY_SUMMER).lerp(SKY_WINTER, s);
        if (scene.background instanceof THREE.Color) scene.background.copy(col);
        if (scene.fog) (scene.fog as THREE.Fog).color.copy(col);
        if (sun.current) sun.current.intensity = 1.55 - s * 0.25;
    });
    return (
        <>
            <ambientLight intensity={0.5} color="#fff4df" />
            <hemisphereLight args={['#fff6e4', '#6b5a44', 0.55]} />
            <directionalLight
                ref={sun}
                position={[-7, 12, 6]}
                intensity={1.5}
                color="#fff1dc"
                castShadow
                shadow-bias={-0.0006}
            >
                <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 1, 40]} />
            </directionalLight>
        </>
    );
}

// ---------------------------------------------------------------------------
// Kartet: terreng med høydekurver, hav, kystlinje og riksgrense
// ---------------------------------------------------------------------------

const MAP_X0 = -8.2;
const MAP_X1 = 9.2;
const MAP_Z0 = -9;
const MAP_Z1 = 8;

const C = (h: string) => new THREE.Color(h);
const COL = {
    seabed: C('#2c3f60'),
    coast: C('#e2b86c'),
    low: C('#f1dca0'),
    field: C('#e8cb84'),
    forest: C('#94aa58'),
    rock: C('#b8a283'),
    snow: C('#f4efe2'),
    foreign: C('#a9a598'),
    winterLow: C('#f2efe6'),
};

function buildTerrain(detail: number) {
    const sx = Math.round(150 * detail);
    const sz = Math.round(150 * detail);
    const geo = new THREE.PlaneGeometry(MAP_X1 - MAP_X0, MAP_Z1 - MAP_Z0, sx, sz);
    geo.rotateX(-Math.PI / 2);
    geo.translate((MAP_X0 + MAP_X1) / 2, 0, (MAP_Z0 + MAP_Z1) / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const n = pos.count;
    const summer = new Float32Array(n * 3);
    const winter = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = heightAt(x, z);
        pos.setY(i, h);
        const land = landAt(x, z);
        const m = mountainAt(x, z);
        // Havbunnen får kystfarge: vannflaten skjærer da kysten glatt, uten trappetrinn.
        if (land === 'hav') c.copy(COL.coast);
        else {
            const wob = Math.sin(x * 3.1 + z * 2.3) * 0.5 + 0.5;
            c.copy(COL.low).lerp(COL.field, wob * 0.5);
            if (h > 0.22) c.lerp(COL.forest, Math.min(1, (h - 0.22) * 3) * 0.7);
            if (m > 0.25) c.lerp(COL.rock, Math.min(1, (m - 0.25) * 3));
            if (m > 0.62) c.lerp(COL.snow, Math.min(0.7, (m - 0.62) * 3));
            if (h < 0.1) c.lerp(COL.coast, 0.6);
            if (land === 'utland') c.lerp(COL.foreign, 0.95);
        }
        summer[i * 3] = c.r;
        summer[i * 3 + 1] = c.g;
        summer[i * 3 + 2] = c.b;
        if (land !== 'hav') c.lerp(COL.winterLow, land === 'utland' ? 0.55 : 0.72);
        winter[i * 3] = c.r;
        winter[i * 3 + 1] = c.g;
        winter[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(summer, 3));
    geo.setAttribute('aWinter', new THREE.BufferAttribute(winter, 3));
    geo.computeVertexNormals();
    return { geo };
}

function driftSea(sea: THREE.Texture, dt: number) {
    sea.offset.x += dt * 0.004;
    sea.offset.y += dt * 0.002;
}

/** Vinter: landet blir hvitt. Blandingen skjer i shaderen, så prosessoren slipper. */
function setSnow(u: { value: number }, s: number) {
    u.value = s;
}

/** Høydekurver i blekk, som på et gammelt kart. Billig: én linje i fragment-shaderen. */
function contourMaterial(map: THREE.Texture, snow: { value: number }) {
    const m = new THREE.MeshStandardMaterial({
        vertexColors: true,
        map,
        roughness: 0.95,
    });
    m.onBeforeCompile = (sh) => {
        sh.uniforms.uSnow = snow;
        sh.vertexShader = sh.vertexShader
            .replace(
                '#include <common>',
                '#include <common>\nvarying float vH;\nattribute vec3 aWinter;\nuniform float uSnow;'
            )
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = position.y;')
            .replace(
                '#include <color_vertex>',
                '#include <color_vertex>\nvColor.rgb = mix(vColor.rgb, aWinter, uSnow);'
            );
        sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', '#include <common>\nvarying float vH;')
            .replace(
                '#include <color_fragment>',
                `#include <color_fragment>
                float fH = vH * 9.0;
                float wH = max(fwidth(fH), 1e-4);
                float dH = abs(fract(fH - 0.5) - 0.5) / wH;
                float lineH = (1.0 - min(dH, 1.0)) * step(0.1, vH);
                diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.24, 0.19, 0.13), lineH * 0.4);`
            );
    };
    m.customProgramCacheKey = () => 'thranittene-kontur';
    return m;
}

// Skrift på kartet, som på et gammelt kart.
const MAP_TEXT = [
    { t: 'SVERIGE', x: 6.4, y: 0.95, z: 0.4, w: 3.2, rot: 0.15, light: false },
    { t: 'NORDSJØEN', x: -6.3, y: 0.02, z: 2.4, w: 2.8, rot: 0.3, light: true },
    { t: 'SKAGERRAK', x: 2.4, y: 0.02, z: 5.6, w: 2.6, rot: 0.1, light: true },
];

export function MapView({ gRef }: { gRef: GRef }) {
    const q = useQuality();
    const detail = q.tier === 'lav' ? 0.7 : 1;
    const terrain = useMemo(() => buildTerrain(detail), [detail]);
    const paper = useMemo(() => paperTexture(), []);
    const snow = useMemo(() => ({ value: 0 }), []);
    const mat = useMemo(() => contourMaterial(paper, snow), [paper, snow]);
    const sea = useMemo(() => seaTexture(), []);
    const mapText = useMemo(() => MAP_TEXT.map((m) => mapLabel(m.t, m.light)), []);
    useEffect(
        () => () => {
            terrain.geo.dispose();
            mat.dispose();
        },
        [terrain, mat]
    );
    useFrame((_, dt) => {
        driftSea(sea, dt);
        setSnow(snow, snowOf(gRef.current.t));
    });

    const coast = useMemo(() => {
        const mk = (poly: XZ[]) => {
            const pts = poly.map(([x, z]) => new THREE.Vector3(x, 0.035, z));
            return new THREE.BufferGeometry().setFromPoints([...pts, pts[0]]);
        };
        return [mk(NORWAY), mk(SWEDEN), mk(JUTLAND)];
    }, []);
    const border = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < BORDER.length - 1; i++) {
            const a = BORDER[i];
            const b = BORDER[i + 1];
            for (let k = 0; k < 8; k++) {
                const x = a[0] + ((b[0] - a[0]) * k) / 8;
                const z = a[1] + ((b[1] - a[1]) * k) / 8;
                pts.push(new THREE.Vector3(x, heightAt(x, z) + 0.05, z));
            }
        }
        const gg = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(
            gg,
            new THREE.LineDashedMaterial({ color: '#7a2a22', dashSize: 0.12, gapSize: 0.08 })
        );
        line.computeLineDistances();
        return line;
    }, []);

    return (
        <group>
            <mesh geometry={terrain.geo} material={mat} receiveShadow />
            {/* Havet: flate med graverte streker */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[(MAP_X0 + MAP_X1) / 2, 0, (MAP_Z0 + MAP_Z1) / 2]}
                receiveShadow
            >
                <planeGeometry args={[MAP_X1 - MAP_X0, MAP_Z1 - MAP_Z0]} />
                <meshStandardMaterial map={sea} roughness={0.55} metalness={0.05} />
            </mesh>
            {coast.map((gg, i) => (
                <line key={i}>
                    <primitive object={gg} attach="geometry" />
                    <lineBasicMaterial color={INK} />
                </line>
            ))}
            <primitive object={border} />
            {MAP_TEXT.map((m, i) => (
                <mesh
                    key={m.t}
                    rotation={[-Math.PI / 2, 0, m.rot]}
                    position={[m.x, m.y, m.z]}
                    renderOrder={1}
                    userData={{ sceneAuditIgnore: true }}
                >
                    <planeGeometry args={[m.w, m.w * 0.22]} />
                    <meshBasicMaterial map={mapText[i]} transparent depthWrite={false} />
                </mesh>
            ))}
            {/* Papirkanten rundt kartet, så verden slutter som et ark */}
            <mesh position={[(MAP_X0 + MAP_X1) / 2, -0.4, (MAP_Z0 + MAP_Z1) / 2]}>
                <boxGeometry args={[MAP_X1 - MAP_X0 + 0.02, 0.78, MAP_Z1 - MAP_Z0 + 0.02]} />
                <meshStandardMaterial color="#d8caa3" roughness={1} />
            </mesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Bygdene: hus, ring, flagg, folk, navn og annonser
// ---------------------------------------------------------------------------

const rng = (seed: number) => {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

const HOUSE = mergeParts([
    {
        geometry: new THREE.BoxGeometry(0.1, 0.075, 0.14),
        position: [0, 0.0375, 0],
        color: '#ffffff',
    },
]);
const ROOF = (() => {
    const g = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 3, 1);
    g.rotateX(Math.PI / 2);
    g.rotateZ(Math.PI / 2);
    g.scale(1, 0.7, 1);
    g.translate(0, 0.098, 0);
    return g;
})();
const PERSON = mergeParts([
    {
        geometry: new THREE.CylinderGeometry(0.018, 0.03, 0.08, 6),
        position: [0, 0.04, 0],
        color: '#ffffff',
    },
    { geometry: new THREE.SphereGeometry(0.02, 6, 5), position: [0, 0.098, 0], color: '#ffffff' },
    // Hatten
    {
        geometry: new THREE.CylinderGeometry(0.014, 0.024, 0.02, 6),
        position: [0, 0.118, 0],
        color: '#ffffff',
    },
]);
const WALL_COLS = ['#efe2c2', '#c9573e', '#e8d9b0', '#a8472f', '#f2ead6', '#d9b98a'];
const PPL = 12;
/** Navnelappene står sør for bygda, unntatt der de ville dekket en nabo rundt Oslofjorden. */
const LABEL_OFF: Record<string, [number, number]> = {
    christiania: [0.85, 0.05],
    kongsberg: [-0.2, -0.6],
    honefoss: [0, -0.6],
    hamar: [0.25, -0.6],
    kongsvinger: [0.1, -0.6],
};

interface HouseSpot {
    x: number;
    z: number;
    y: number;
    rot: number;
    s: number;
    col: string;
}

const HOUSES: HouseSpot[] = (() => {
    const out: HouseSpot[] = [];
    PLACES.forEach((p, i) => {
        const r = rng(31 + i * 97);
        const n = i === 0 ? 14 : 3 + Math.round(p.pop / 700);
        for (let k = 0; k < n; k++) {
            const a = r() * Math.PI * 2;
            const d = 0.1 + r() * (i === 0 ? 0.36 : 0.22);
            const x = p.pos[0] + Math.cos(a) * d;
            const z = p.pos[1] + Math.sin(a) * d;
            if (landAt(x, z) === 'hav') continue;
            out.push({
                x,
                z,
                y: groundY([x, z]),
                rot: r() * Math.PI,
                s: 1.2 + r() * 0.5 + (i === 0 ? 0.25 : 0),
                col: WALL_COLS[Math.floor(r() * WALL_COLS.length)],
            });
        }
    });
    return out;
})();

/** Folket står i en ring rundt flagget, vendt inn mot midten. */
const PEOPLE = PLACES.map((p, i) => {
    const r = rng(501 + i * 13);
    return Array.from({ length: PPL }, (_, k) => {
        const a = (k / PPL) * Math.PI * 2 + r() * 0.3;
        const d = 0.3 + r() * 0.1;
        const x = p.pos[0] + Math.cos(a) * d;
        const z = p.pos[1] + Math.sin(a) * d;
        return { x, z, y: groundY([x, z]), face: -a - Math.PI / 2, ph: r() * 6 };
    });
});

// Ringene rundt bygdene: hvor langt møtet har kommet mot egen forening. Alle 25
// tegnes i ett kall (instanser), med fremdrift, farge og styrke per bygd.
const RING_VS = `attribute float aProg; attribute vec3 aCol; attribute float aAlpha;
varying vec2 vP; varying float vProg; varying vec3 vCol; varying float vAlpha;
void main(){ vP = vec2(position.x, -position.z); vProg = aProg; vCol = aCol; vAlpha = aAlpha;
gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position,1.0); }`;
const RING_FS = `uniform vec3 uBase; varying vec2 vP; varying float vProg; varying vec3 vCol; varying float vAlpha;
void main(){ float a = fract(0.25 - atan(vP.y, vP.x) / 6.2831853); bool on = a < vProg;
if (vAlpha < 0.0 && abs(fract(a * 3.0 + 0.5) - 0.5) < 0.03) discard;
gl_FragColor = vec4(on ? vCol : uBase, (on ? 1.0 : 0.45) * abs(vAlpha)); }`;

function ringParts() {
    const n = PLACES.length;
    const geo = new THREE.RingGeometry(0.44, 0.52, 48);
    geo.rotateX(-Math.PI / 2);
    const prog = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    const col = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const alpha = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    geo.setAttribute('aProg', prog);
    geo.setAttribute('aCol', col);
    geo.setAttribute('aAlpha', alpha);
    const mat = new THREE.ShaderMaterial({
        vertexShader: RING_VS,
        fragmentShader: RING_FS,
        transparent: true,
        depthWrite: false,
        uniforms: { uBase: { value: new THREE.Color(INK).convertSRGBToLinear() } },
    });
    return { geo, mat, prog, col, alpha };
}

type RingParts = ReturnType<typeof ringParts>;

function setRing(r: RingParts, i: number, prog: number, c: THREE.Color, alpha: number) {
    r.prog.setX(i, prog);
    r.col.setXYZ(i, c.r, c.g, c.b);
    r.alpha.setX(i, alpha);
}
function flushRings(r: RingParts) {
    r.prog.needsUpdate = true;
    r.col.needsUpdate = true;
    r.alpha.needsUpdate = true;
}

export function Villages({
    gRef,
    hoverRef,
}: {
    gRef: GRef;
    hoverRef: React.MutableRefObject<number>;
}) {
    const q = useQuality();
    const walls = useRef<THREE.InstancedMesh>(null);
    const roofs = useRef<THREE.InstancedMesh>(null);
    const poles = useRef<THREE.InstancedMesh>(null);
    const cloths = useRef<THREE.InstancedMesh>(null);
    const people = useRef<THREE.InstancedMesh>(null);
    const rings = useRef<THREE.InstancedMesh>(null);
    const ads = useRef<(THREE.Sprite | null)[]>([]);
    const ringP = useMemo(() => ringParts(), []);
    const adTex = useMemo(() => annonseTexture(), []);
    const gl = useThree((st) => st.gl);
    // Last opp alle lappene med en gang, så bytte av lapp midt i spillet ikke hakker.
    useEffect(() => {
        gl.initTexture(adTex);
    }, [gl, adTex]);
    const raise = useRef(PLACES.map(() => 0));
    const crowd = useRef(PLACES.map(() => 0));
    const pplMax = Math.max(4, Math.round(PPL * q.detail));

    useEffect(() => {
        const w = walls.current;
        const r = roofs.current;
        if (!w || !r) return;
        HOUSES.forEach((h, i) => {
            tmpObj.position.set(h.x, h.y, h.z);
            tmpObj.rotation.set(0, h.rot, 0);
            tmpObj.scale.setScalar(h.s);
            tmpObj.updateMatrix();
            w.setMatrixAt(i, tmpObj.matrix);
            r.setMatrixAt(i, tmpObj.matrix);
            w.setColorAt(i, tmpCol.set(h.col));
        });
        w.instanceMatrix.needsUpdate = true;
        r.instanceMatrix.needsUpdate = true;
        if (w.instanceColor) w.instanceColor.needsUpdate = true;
    }, []);

    useFrame((state, rawDt) => {
        const g = gRef.current;
        const dt = Math.min(0.05, rawDt);
        const t = state.clock.elapsedTime;
        const pl = poles.current;
        const cl = cloths.current;
        const pp = people.current;
        let np = 0;
        g.villages.forEach((v, i) => {
            const p = PLACES[i];
            const gy = VILLAGE_Y[i];
            // Flagget heises når foreningen er startet, og tas ned når den går i oppløsning.
            const fill = v.forening ? v.members / p.pop : 0;
            const want = v.forening ? 0.55 + fill * 0.45 : 0;
            raise.current[i] += (want - raise.current[i]) * Math.min(1, dt * 3);
            const rz = raise.current[i];
            if (pl && cl) {
                tmpObj.position.set(p.pos[0], gy, p.pos[1]);
                tmpObj.rotation.set(0, 0, 0);
                tmpObj.scale.set(1, rz > 0.02 ? 1 : 0.0001, 1);
                tmpObj.updateMatrix();
                pl.setMatrixAt(i, tmpObj.matrix);
                const wave = Math.sin(t * 5 + i) * 0.25;
                tmpObj.position.set(p.pos[0] + 0.1, gy + 0.2 + rz * 0.42, p.pos[1]);
                tmpObj.rotation.set(0, wave, Math.sin(t * 7 + i) * 0.05);
                tmpObj.scale.setScalar(rz > 0.02 ? 0.6 + rz * 0.5 : 0.0001);
                tmpObj.updateMatrix();
                cl.setMatrixAt(i, tmpObj.matrix);
            }
            // Folk som samles: møte = noen få, forening = mange.
            const wantCrowd = v.forening ? 3 + fill * (pplMax - 3) : v.glow * 4;
            crowd.current[i] += (wantCrowd - crowd.current[i]) * Math.min(1, dt * 2);
            const nc = Math.min(pplMax, Math.round(crowd.current[i]));
            if (pp) {
                const ring = PEOPLE[i];
                for (let k = 0; k < nc; k++) {
                    const s = ring[k];
                    const hop =
                        v.hitAt > g.t - 0.8 || v.foundedAt > g.t - 1.5
                            ? Math.abs(Math.sin(t * 12 + s.ph)) * 0.05
                            : 0;
                    tmpObj.position.set(s.x, s.y + hop, s.z);
                    tmpObj.rotation.set(0, s.face, 0);
                    tmpObj.scale.setScalar(1);
                    tmpObj.updateMatrix();
                    pp.setMatrixAt(np, tmpObj.matrix);
                    pp.setColorAt(np, v.forening ? (k % 3 === 0 ? COL_RED : COL_COAT) : COL_GUEST);
                    np++;
                }
            }
            // Ringen
            const rm = rings.current;
            if (rm) {
                const hover = hoverRef.current === i;
                const alpha = v.forening || v.glow > 0.01 || hover || v.fear > 0 ? 0.95 : 0.35;
                // Skremt: en grå ring som tømmes mens frykten går over.
                // Annonse: en svart ring som tømmes - så lenge har du på deg å svare.
                if (v.annonse > 0) setRing(ringP, i, v.annonse / 11, RING_AD, 1);
                else if (v.fear > 0) setRing(ringP, i, v.fear / 28, RING_FEAR, alpha);
                else if (v.forening) setRing(ringP, i, fill, RING_RED, alpha);
                // Møtet: ringen er delt i tre - tre treff, og bygda organiserer seg.
                else setRing(ringP, i, Math.min(1, v.glow), RING_MEET, -alpha);
                const recent = Math.max(0, 1 - (g.t - v.hitAt) * 2);
                tmpObj.position.set(p.pos[0], gy + 0.03, p.pos[1]);
                tmpObj.rotation.set(0, 0, 0);
                tmpObj.scale.setScalar(
                    1 + recent * 0.25 + (hover ? 0.12 + Math.sin(t * 8) * 0.04 : 0)
                );
                tmpObj.updateMatrix();
                rm.setMatrixAt(i, tmpObj.matrix);
            }
            const ad = ads.current[i];
            if (ad) {
                ad.visible = v.annonse > 0;
                if (ad.visible) {
                    ad.position.y = gy + 1.1 + Math.sin(t * 3 + i) * 0.05;
                    const pulse = 1 + Math.sin(t * 6) * 0.04;
                    ad.scale.set(1.8 * pulse, 0.98 * pulse, 1);
                }
            }
        });
        if (rings.current) {
            rings.current.instanceMatrix.needsUpdate = true;
            flushRings(ringP);
        }
        if (pl) pl.instanceMatrix.needsUpdate = true;
        if (cl) cl.instanceMatrix.needsUpdate = true;
        if (pp) {
            pp.count = np;
            pp.instanceMatrix.needsUpdate = true;
            if (pp.instanceColor) pp.instanceColor.needsUpdate = true;
        }
    });

    return (
        <group>
            <instancedMesh
                ref={walls}
                args={[HOUSE, undefined, HOUSES.length]}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial vertexColors roughness={0.85} />
            </instancedMesh>
            <instancedMesh ref={roofs} args={[ROOF, undefined, HOUSES.length]} castShadow>
                <meshStandardMaterial color="#8c4630" roughness={0.9} flatShading />
            </instancedMesh>
            <instancedMesh ref={poles} args={[undefined, undefined, PLACES.length]}>
                <cylinderGeometry args={[0.012, 0.016, 0.7, 5]} />
                <meshStandardMaterial color="#2b231c" roughness={0.8} />
            </instancedMesh>
            <instancedMesh ref={cloths} args={[undefined, undefined, PLACES.length]}>
                <planeGeometry args={[0.3, 0.19]} />
                <meshStandardMaterial
                    color={RED}
                    side={THREE.DoubleSide}
                    roughness={0.7}
                    emissive={RED}
                    emissiveIntensity={0.25}
                />
            </instancedMesh>
            <instancedMesh
                ref={people}
                args={[PERSON, undefined, PLACES.length * PPL]}
                frustumCulled={false}
            >
                <meshStandardMaterial vertexColors roughness={0.9} />
            </instancedMesh>
            <instancedMesh
                ref={rings}
                args={[ringP.geo, ringP.mat, PLACES.length]}
                frustumCulled={false}
                renderOrder={2}
            />
            {PLACES.map((p, i) => {
                const gy = groundY(p.pos);
                return (
                    <group key={p.id}>
                        <sprite
                            visible={false}
                            position={[p.pos[0], gy + 0.95, p.pos[1]]}
                            scale={[0.95, 0.52, 1]}
                            ref={(el) => {
                                ads.current[i] = el;
                            }}
                            renderOrder={4}
                        >
                            <spriteMaterial map={adTex} depthWrite={false} />
                        </sprite>
                    </group>
                );
            })}
        </group>
    );
}

// Navnelappene: ett tegnekall for alle. Hver lapp vender mot kameraet og er
// blek til bygda får et møte eller en forening.
const LABEL_VS = `attribute vec2 aCell; attribute float aOn; uniform vec2 uGrid; varying vec2 vUv; varying float vOn;
void main(){ vUv = (uv + aCell) / uGrid; vOn = aOn;
gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`;
const LABEL_FS = `uniform sampler2D uMap; varying vec2 vUv; varying float vOn;
void main(){ vec4 c = texture2D(uMap, vUv); if (c.a < 0.02) discard;
if (vOn < 0.01) discard;
gl_FragColor = vec4(c.rgb, c.a * vOn);
#include <colorspace_fragment>
}`;

function labelParts() {
    const { tex, rows } = labelAtlas(PLACES.map((p) => p.name));
    const geo = new THREE.PlaneGeometry(1.15, 0.27);
    const cell = new Float32Array(PLACES.length * 2);
    PLACES.forEach((_, i) => {
        cell[i * 2] = i % LABEL_COLS;
        cell[i * 2 + 1] = rows - 1 - Math.floor(i / LABEL_COLS);
    });
    const on = new THREE.InstancedBufferAttribute(new Float32Array(PLACES.length), 1);
    geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 2));
    geo.setAttribute('aOn', on);
    const mat = new THREE.ShaderMaterial({
        vertexShader: LABEL_VS,
        fragmentShader: LABEL_FS,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: { uMap: { value: tex }, uGrid: { value: new THREE.Vector2(LABEL_COLS, rows) } },
    });
    return { geo, mat, on };
}
type LabelPartsT = ReturnType<typeof labelParts>;
function setLabelOn(l: LabelPartsT, i: number, on: number) {
    l.on.setX(i, on);
    l.on.needsUpdate = true;
}

export function Labels({
    gRef,
    hoverRef,
}: {
    gRef: GRef;
    hoverRef: React.MutableRefObject<number>;
}) {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const parts = useMemo(() => labelParts(), []);
    useFrame((state) => {
        const m = mesh.current;
        if (!m) return;
        const g = gRef.current;
        PLACES.forEach((p, i) => {
            const off = LABEL_OFF[p.id] ?? [0, 0.66];
            tmpObj.position.set(p.pos[0] + off[0], VILLAGE_Y[i] + 0.12, p.pos[1] + off[1]);
            tmpObj.quaternion.copy(state.camera.quaternion);
            tmpObj.scale.setScalar(1);
            tmpObj.updateMatrix();
            m.setMatrixAt(i, tmpObj.matrix);
            const v = g.villages[i];
            // Bare bygder med møte eller forening har navnelapp - pluss de store byene og den musa peker på.
            const on =
                v.forening || v.glow > 0.01 || hoverRef.current === i ? 1 : p.pop >= 2400 ? 0.6 : 0;
            setLabelOn(parts, i, on);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={mesh}
            args={[parts.geo, parts.mat, PLACES.length]}
            frustumCulled={false}
            renderOrder={3}
        />
    );
}

// ---------------------------------------------------------------------------
// Trykkeriet i Christiania
// ---------------------------------------------------------------------------

const BUNDLE = mergeParts([
    { geometry: new THREE.BoxGeometry(0.2, 0.09, 0.14), color: '#efe6cf' },
    { geometry: new THREE.BoxGeometry(0.205, 0.095, 0.02), color: '#7a4a2a' },
    { geometry: new THREE.BoxGeometry(0.02, 0.095, 0.145), color: '#7a4a2a' },
    // Mastehodet på øverste avis
    {
        geometry: new THREE.BoxGeometry(0.16, 0.004, 0.03),
        position: [0, 0.047, -0.04],
        color: '#1f1b16',
    },
]);
const LETTER = mergeParts([
    { geometry: new THREE.BoxGeometry(0.13, 0.012, 0.09), color: '#fbf6e9' },
    {
        geometry: new THREE.CylinderGeometry(0.018, 0.018, 0.016, 8),
        position: [0, 0.004, 0],
        color: RED,
    },
]);

export function Press({ gRef }: { gRef: GRef }) {
    const plate = useRef<THREE.Mesh>(null);
    const stack = useRef<THREE.InstancedMesh>(null);
    const smoke = useRef<(THREE.Mesh | null)[]>([]);
    const sign = useMemo(() => pressSign(), []);
    const [x, z] = PRESS_POS;
    const y = groundY(PRESS_POS);
    useFrame((state) => {
        const g = gRef.current;
        if (plate.current) plate.current.position.y = y + 0.34 - g.pressKick * 0.08;
        const s = stack.current;
        if (s) {
            for (let k = 0; k < 5; k++) {
                tmpObj.position.set(x + 0.32, y + 0.05 + k * 0.1, z + 0.08);
                tmpObj.rotation.set(0, k * 0.3, 0);
                tmpObj.scale.setScalar(k < Math.floor(g.stock) ? 1 : 0.0001);
                tmpObj.updateMatrix();
                s.setMatrixAt(k, tmpObj.matrix);
            }
            s.instanceMatrix.needsUpdate = true;
        }
        const t = state.clock.elapsedTime;
        smoke.current.forEach((m, k) => {
            if (!m) return;
            const f = (t * 0.35 + k / 4) % 1;
            m.position.set(x - 0.12 + f * 0.25, y + 0.62 + f * 0.9, z - 0.05 - f * 0.2);
            m.scale.setScalar(0.06 + f * 0.16);
            (m.material as THREE.MeshStandardMaterial).opacity = 0.55 * (1 - f);
        });
    });
    return (
        <group>
            {/* Trykkeriet: murhus med saltak og pipe */}
            <mesh position={[x, y + 0.16, z]} castShadow receiveShadow>
                <boxGeometry args={[0.46, 0.32, 0.34]} />
                <meshStandardMaterial color="#b9523a" roughness={0.9} />
            </mesh>
            <mesh position={[x, y + 0.4, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.5, 3]} />
                <meshStandardMaterial color="#2f261e" roughness={0.9} flatShading />
            </mesh>
            <mesh position={[x - 0.12, y + 0.52, z - 0.05]} castShadow>
                <boxGeometry args={[0.07, 0.24, 0.07]} />
                <meshStandardMaterial color="#6f3b2a" roughness={0.9} />
            </mesh>
            <sprite position={[x, y + 0.82, z + 0.05]} scale={[0.72, 0.17, 1]} renderOrder={3}>
                <spriteMaterial map={sign} depthWrite={false} />
            </sprite>
            {/* Pressplata som dunker når en bunt kommer ut */}
            <mesh ref={plate} position={[x + 0.32, y + 0.34, z + 0.08]} castShadow>
                <boxGeometry args={[0.26, 0.04, 0.2]} />
                <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
            </mesh>
            {[-1, 1].map((s) => (
                <mesh key={s} position={[x + 0.32 + s * 0.12, y + 0.2, z + 0.08]}>
                    <boxGeometry args={[0.025, 0.4, 0.025]} />
                    <meshStandardMaterial color="#2b231c" />
                </mesh>
            ))}
            <instancedMesh ref={stack} args={[BUNDLE, undefined, 5]} castShadow>
                <meshStandardMaterial vertexColors roughness={0.8} />
            </instancedMesh>
            {[0, 1, 2, 3].map((k) => (
                <mesh
                    key={k}
                    ref={(el) => {
                        smoke.current[k] = el;
                    }}
                    userData={{ sceneAuditIgnore: true }}
                >
                    <sphereGeometry args={[1, 8, 6]} />
                    <meshStandardMaterial
                        color="#6b6258"
                        transparent
                        opacity={0.5}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ---------------------------------------------------------------------------
// Bunter og brev i lufta, papirsprut
// ---------------------------------------------------------------------------

const FLY_MAX = 14;
const LETTER_MAX = 30;
const FX_MAX = 150;

export function Flyers({ gRef }: { gRef: GRef }) {
    const bundles = useRef<THREE.InstancedMesh>(null);
    const letters = useRef<THREE.InstancedMesh>(null);
    const shadows = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const g = gRef.current;
        const b = bundles.current;
        const l = letters.current;
        const sh = shadows.current;
        if (!b || !l || !sh) return;
        let n = 0;
        for (const x of g.bundles) {
            if (n >= FLY_MAX) break;
            bundlePos(x, tmpV);
            const k = x.t / x.dur;
            tmpObj.position.set(tmpV[0], tmpV[1], tmpV[2]);
            tmpObj.rotation.set(k * 5, Math.atan2(x.to[0] - x.from[0], x.to[1] - x.from[1]), k * 2);
            tmpObj.scale.setScalar(2);
            tmpObj.updateMatrix();
            b.setMatrixAt(n, tmpObj.matrix);
            // Skyggen på bakken viser hvor bunten er på vei.
            const y1 = x.target >= 0 ? VILLAGE_Y[x.target] : 0.06;
            tmpObj.position.set(tmpV[0], PRESS_Y + (y1 - PRESS_Y) * k + 0.03, tmpV[2]);
            tmpObj.rotation.set(-Math.PI / 2, 0, 0);
            tmpObj.scale.setScalar(0.5 + (1 - Math.abs(0.5 - k) * 2) * -0.25 + 0.25);
            tmpObj.updateMatrix();
            sh.setMatrixAt(n, tmpObj.matrix);
            n++;
        }
        b.count = n;
        sh.count = n;
        b.instanceMatrix.needsUpdate = true;
        sh.instanceMatrix.needsUpdate = true;
        let m = 0;
        for (const x of g.letters) {
            if (m >= LETTER_MAX) break;
            letterPos(x, tmpV);
            tmpObj.position.set(tmpV[0], tmpV[1], tmpV[2]);
            tmpObj.rotation.set(Math.sin(x.t * 8) * 0.4, x.t * 3, Math.cos(x.t * 7) * 0.3);
            tmpObj.scale.setScalar(1.3);
            tmpObj.updateMatrix();
            l.setMatrixAt(m++, tmpObj.matrix);
        }
        l.count = m;
        l.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            <instancedMesh
                ref={bundles}
                args={[BUNDLE, undefined, FLY_MAX]}
                frustumCulled={false}
                castShadow
            >
                <meshStandardMaterial vertexColors roughness={0.8} />
            </instancedMesh>
            <instancedMesh
                ref={shadows}
                args={[undefined, undefined, FLY_MAX]}
                frustumCulled={false}
            >
                <circleGeometry args={[0.16, 16]} />
                <meshBasicMaterial color="#1f1b16" transparent opacity={0.28} depthWrite={false} />
            </instancedMesh>
            <instancedMesh
                ref={letters}
                args={[LETTER, undefined, LETTER_MAX]}
                frustumCulled={false}
            >
                <meshStandardMaterial
                    vertexColors
                    roughness={0.7}
                    emissive="#fff4d8"
                    emissiveIntensity={0.25}
                />
            </instancedMesh>
        </group>
    );
}

export function FxView({ gRef }: { gRef: GRef }) {
    const pages = useRef<THREE.InstancedMesh>(null);
    const dots = useRef<THREE.InstancedMesh>(null);
    useFrame(() => {
        const g = gRef.current;
        const pg = pages.current;
        const dd = dots.current;
        if (!pg || !dd) return;
        let np = 0;
        let nd = 0;
        for (const f of g.fx as Fx[]) {
            const k = f.life / f.max;
            if (f.kind === 'page') {
                tmpObj.position.set(f.p[0], f.p[1], f.p[2]);
                tmpObj.rotation.set(f.rot, f.rot * 0.7, f.rot * 0.3);
                tmpObj.scale.setScalar(1 - k * 0.4);
                tmpObj.updateMatrix();
                pg.setMatrixAt(np++, tmpObj.matrix);
            } else {
                tmpObj.position.set(f.p[0], f.p[1], f.p[2]);
                tmpObj.rotation.set(0, 0, 0);
                tmpObj.scale.setScalar((f.kind === 'ink' ? 0.05 : 0.035) * (1 - k * 0.6));
                tmpObj.updateMatrix();
                dd.setMatrixAt(nd, tmpObj.matrix);
                if (f.kind === 'ink') tmpCol.setRGB(0.05, 0.04, 0.03);
                else tmpCol.setRGB(3.2, 1.3 + (1 - k), 0.35);
                dd.setColorAt(nd, tmpCol);
                nd++;
            }
        }
        pg.count = np;
        dd.count = nd;
        pg.instanceMatrix.needsUpdate = true;
        dd.instanceMatrix.needsUpdate = true;
        if (dd.instanceColor) dd.instanceColor.needsUpdate = true;
    });
    return (
        <group>
            <instancedMesh ref={pages} args={[undefined, undefined, FX_MAX]} frustumCulled={false}>
                <planeGeometry args={[0.09, 0.12]} />
                <meshStandardMaterial color="#f6efdc" side={THREE.DoubleSide} roughness={0.8} />
            </instancedMesh>
            <instancedMesh ref={dots} args={[undefined, undefined, FX_MAX]} frustumCulled={false}>
                <sphereGeometry args={[1, 6, 5]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>
        </group>
    );
}

// ---------------------------------------------------------------------------
// Siktet: stiplet bue fra pressa til bygda musa peker på
// ---------------------------------------------------------------------------

const ARC_N = 36;

/** Legger den stiplede buen fra pressa til `to`, eller skjuler den. */
function drawArc(line: THREE.Line, to: XZ | null, ready: boolean, onVillage: boolean) {
    line.visible = !!to;
    if (!to) return;
    const d = Math.hypot(to[0] - PRESS_POS[0], to[1] - PRESS_POS[1]);
    const h = 0.9 + d * 0.28;
    const pos = line.geometry.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < ARC_N; k++) {
        const f = k / (ARC_N - 1);
        pos.setXYZ(
            k,
            PRESS_POS[0] + (to[0] - PRESS_POS[0]) * f,
            0.45 + 4 * h * f * (1 - f),
            PRESS_POS[1] + (to[1] - PRESS_POS[1]) * f
        );
    }
    pos.needsUpdate = true;
    line.geometry.computeBoundingSphere();
    line.computeLineDistances();
    const mat = line.material as THREE.LineDashedMaterial;
    mat.color.set(ready ? (onVillage ? RED : '#6b6257') : '#9a9184');
    mat.opacity = ready ? 0.85 : 0.35;
}
export function AimView({
    gRef,
    hoverRef,
    hoverPt,
    modeRef,
}: {
    gRef: GRef;
    hoverRef: React.MutableRefObject<number>;
    hoverPt: React.MutableRefObject<XZ | null>;
    modeRef: React.MutableRefObject<Mode>;
}) {
    const line = useMemo(() => {
        const gg = new THREE.BufferGeometry();
        gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_N * 3), 3));
        const l = new THREE.Line(
            gg,
            new THREE.LineDashedMaterial({
                color: INK,
                dashSize: 0.14,
                gapSize: 0.1,
                transparent: true,
                opacity: 0.8,
            })
        );
        l.frustumCulled = false;
        return l;
    }, []);
    useFrame(() => {
        const i = hoverRef.current;
        const pt = hoverPt.current;
        const on = modeRef.current === 'play' && (i >= 0 || pt !== null);
        drawArc(line, on ? (i >= 0 ? PLACES[i].pos : pt) : null, gRef.current.stock >= 1, i >= 0);
    });
    return <primitive object={line} />;
}

// ---------------------------------------------------------------------------
// Skyer (bare pynt) og flaten som fanger pekeren
// ---------------------------------------------------------------------------

// En sky er tre flate kuler slått sammen til én geometri (ett tegnekall).
const CLOUD = mergeParts(
    [
        [0, 0, 0, 0.5],
        [0.45, -0.05, 0.1, 0.36],
        [-0.42, -0.06, -0.05, 0.34],
    ].map(([x, y, z, r]) => ({
        geometry: new THREE.SphereGeometry(r, 10, 8),
        position: [x, y, z] as [number, number, number],
        scale: [1, 0.42, 0.8] as [number, number, number],
        color: '#fbf7ec',
    }))
);

export function Clouds() {
    const group = useRef<THREE.Group>(null);
    const spots = useMemo(() => {
        const r = rng(77);
        return Array.from({ length: 5 }, (_, k) => ({
            x: -7 + r() * 14,
            z: -8 + k * 3.6 + r(),
            s: 0.6 + r() * 0.5,
            v: 0.05 + r() * 0.06,
        }));
    }, []);
    useFrame((state) => {
        const g = group.current;
        if (!g) return;
        const t = state.clock.elapsedTime;
        g.children.forEach((c, k) => {
            const s = spots[k];
            c.position.x = ((s.x + t * s.v + 9) % 18) - 9;
        });
    });
    return (
        <group ref={group} userData={{ sceneAuditIgnore: true }}>
            {spots.map((s, k) => (
                <mesh
                    key={k}
                    geometry={CLOUD}
                    position={[s.x, 3.4 + (k % 2) * 0.3, s.z]}
                    scale={s.s}
                >
                    <meshStandardMaterial
                        vertexColors
                        transparent
                        opacity={0.38}
                        roughness={1}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

export function Catcher({
    onMove,
    onDown,
    onLeave,
}: {
    onMove: (p: XZ) => void;
    onDown: (p: XZ, e: ThreeEvent<PointerEvent>) => void;
    onLeave: () => void;
}) {
    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0.5, 0.2, -0.5]}
            onPointerMove={(e) => onMove([e.point.x, e.point.z])}
            onPointerDown={(e) => onDown([e.point.x, e.point.z], e)}
            onPointerLeave={onLeave}
            userData={{ sceneAuditIgnore: true }}
        >
            <planeGeometry args={[17, 17]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
    );
}
