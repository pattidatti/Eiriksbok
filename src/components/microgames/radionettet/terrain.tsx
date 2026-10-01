import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { MAP_D, MAP_W, FLYPLASS, SLAG, type SlagDef } from './levels';
import { usedChannels, waveDef, ringOf, type G } from './game';
import { C, DECO, LOOK, figureMaterial, hqModel, type Look, type Model } from './models';
import { Lighting } from './light';
import { BoardDetail, Bridges, Haze, Water } from './relief';
import { GD, GW, X0, Z0, SKIRT_Y, WATER_Y, craterSpots, groundGeometry, heightAt, isSea, withClouds, lift, tilt, MARKS } from './ground';

// Slagmarken som et ekte landskap sett ovenfra: bakken males én gang i canvas per slag
// (gress, jord, sand, hjulspor, kratre, veien), og pynten utenfor kartet er instanser
// med ekte skygger. Kartet mørkner litt utenfor spillbrettet, så brettet står fram.


interface Ground {
    base: string;
    fields: string[];
    tuft: [string, string];
    road: string;
    rut: string;
    dust: string;
}

const GROUND: Record<Look, Ground> = {
    kyst: { base: '#66733f', fields: ['#74823f', '#5d6a37', '#808a4c', '#6e5d40', '#7a8748'], tuft: ['#4c5a2c', '#8c9657'], road: '#86827a', rut: '#5b574f', dust: '#6e6450' },
    ørken: { base: '#b89968', fields: ['#c4a878', '#ae8f5f', '#bfa272', '#a98a5c'], tuft: ['#a88c5e', '#dcc49a'], road: '#94795a', rut: '#6e5a3e', dust: '#8a7152' },
    steppe: { base: '#6f6a3a', fields: ['#c7a654', '#b89846', '#d3b664', '#5e4c32', '#7b7a42'], tuft: ['#565a2c', '#a39650'], road: '#8a7654', rut: '#5f4e36', dust: '#6d5a3e' },
    vinter: { base: '#d4d9dc', fields: ['#e2e6e8', '#cbd1d4', '#dde1e3', '#bfc6c9'], tuft: ['#8f9892', '#f4f6f7'], road: '#8f8b84', rut: '#5a564f', dust: '#a8a49c' },
};

/** Fast tilfeldighet per slag, så kartet ser likt ut hver gang. */
function seeded(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

function noiseTile(rnd: () => number) {
    const t = document.createElement('canvas');
    t.width = t.height = 128;
    const c = t.getContext('2d')!;
    const img = c.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (rnd() - 0.5) * 120;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return t;
}

function drawGround(def: SlagDef, PX: number) {
    const look = LOOK[def.id] ?? 'kyst';
    const pal = GROUND[look];
    const cv = document.createElement('canvas');
    cv.width = GW * PX;
    cv.height = GD * PX;
    const c = cv.getContext('2d')!;
    const px = (x: number) => (x - X0) * PX;
    const pz = (z: number) => (z - Z0) * PX;
    const rnd = seeded(def.id.length * 977 + 13);
    const W = cv.width;
    const H = cv.height;
    c.fillStyle = pal.base;
    c.fillRect(0, 0, W, H);

    // Myke flekker i grunnfargen: bakken er aldri helt jevn.
    const soft = (x: number, y: number, r: number, col: string, a: number) => {
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = a;
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
        c.globalAlpha = 1;
    };
    for (let i = 0; i < 90; i++) soft(rnd() * W, rnd() * H, (0.6 + rnd() * 2) * PX, pal.fields[i % pal.fields.length], 0.35);

    // Åkre og beiter: skjeve firkanter med furer eller korn, hekker langs kanten ved kysten.
    const fieldEdges: [number, number][][] = [];
    if (look !== 'ørken') {
        for (let i = 0; i < 34; i++) {
            const x = X0 + rnd() * GW;
            const z = Z0 + rnd() * GD;
            const w = 2 + rnd() * 3.5;
            const d = 1.6 + rnd() * 2.6;
            const sk = (rnd() - 0.5) * 0.6;
            const pts: [number, number][] = [[x, z], [x + w, z + sk], [x + w + sk, z + d], [x + sk, z + d - sk]];
            c.beginPath();
            pts.forEach(([a, b], k) => (k ? c.lineTo(px(a), pz(b)) : c.moveTo(px(a), pz(b))));
            c.closePath();
            c.globalAlpha = 0.75;
            c.fillStyle = pal.fields[i % pal.fields.length];
            c.fill();
            c.globalAlpha = 1;
            c.save();
            c.clip();
            // Furer i jorda eller rader i kornet.
            const ang = rnd() * Math.PI;
            c.translate(px(x + w / 2), pz(z + d / 2));
            c.rotate(ang);
            c.strokeStyle = i % 3 === 0 ? 'rgba(40,30,15,.18)' : 'rgba(255,240,200,.08)';
            c.lineWidth = PX * 0.05;
            for (let k = -40; k < 40; k++) {
                c.beginPath();
                c.moveTo(k * PX * 0.14, -PX * 5);
                c.lineTo(k * PX * 0.14, PX * 5);
                c.stroke();
            }
            c.restore();
            fieldEdges.push(pts);
        }
    } else {
        // Sanddyner: lange rygger med lys side mot sola og skygge bak.
        for (let i = 0; i < 40; i++) {
            const x = px(X0 + rnd() * GW);
            const y = pz(Z0 + rnd() * GD);
            const w = (1.4 + rnd() * 3) * PX;
            c.save();
            c.translate(x, y);
            c.rotate(-0.35 + (rnd() - 0.5) * 0.3);
            c.globalAlpha = 0.35;
            c.fillStyle = '#e6d1a6';
            c.beginPath();
            c.ellipse(0, -w * 0.05, w * 0.5, w * 0.12, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#9c7f55';
            c.beginPath();
            c.ellipse(w * 0.02, w * 0.08, w * 0.48, w * 0.07, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
        c.globalAlpha = 1;
        // Småstein.
        for (let i = 0; i < 700; i++) {
            const x = rnd() * W;
            const y = rnd() * H;
            const r = 1 + rnd() * 3;
            c.fillStyle = 'rgba(70,55,35,.45)';
            c.beginPath();
            c.arc(x + 1, y + 1, r, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = 'rgba(225,205,165,.7)';
            c.beginPath();
            c.arc(x, y, r * 0.8, 0, Math.PI * 2);
            c.fill();
        }
    }

    // Gresstuster / kratt: tusenvis av korte strøk.
    for (let i = 0; i < (look === 'ørken' ? 1800 : 7000); i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        c.strokeStyle = pal.tuft[i % 2];
        c.globalAlpha = 0.35 + rnd() * 0.3;
        c.lineWidth = 1 + rnd() * 1.5;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (rnd() - 0.5) * 5, y - 3 - rnd() * 4);
        c.stroke();
    }
    c.globalAlpha = 1;

    // Havet ved Dunkerque: grått hav, skum langs stranda og våt sand.
    if (look === 'kyst' && !def.elv) {
        const shore = (k: number) => {
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(px(-1.1 + k), 0);
            c.bezierCurveTo(px(-1.5 + k), pz(2), px(-0.9 + k), pz(4), px(-1.2 + k), pz(6 + k * 0.5));
            c.lineTo(0, pz(6.3 + k * 0.5));
            c.closePath();
        };
        shore(0.9);
        c.fillStyle = '#c9bb8e';
        c.fill();
        shore(0.35);
        c.fillStyle = '#9e9272';
        c.fill();
        shore(0);
        const sea = c.createLinearGradient(0, 0, px(-1), 0);
        sea.addColorStop(0, '#3f4f55');
        sea.addColorStop(1, '#5d6d70');
        c.fillStyle = sea;
        c.fill();
        c.save();
        c.clip();
        c.strokeStyle = 'rgba(235,240,238,.35)';
        c.lineWidth = 2;
        for (let i = 0; i < 90; i++) {
            const x = rnd() * px(-1);
            const y = rnd() * pz(6.4);
            c.beginPath();
            c.moveTo(x, y);
            c.quadraticCurveTo(x + 8, y - 4, x + 18, y);
            c.stroke();
        }
        c.restore();
        shore(0);
        c.strokeStyle = 'rgba(240,244,240,.7)';
        c.lineWidth = 5;
        c.stroke();
    }

    // Hekker: mørke, klumpete kanter med skygge mot nedre høyre.
    if (look === 'kyst') {
        for (const pts of fieldEdges.slice(0, 20))
            for (let k = 0; k < 4; k++) {
                if (rnd() < 0.35) continue;
                const [a, b] = pts[k];
                const [e, f] = pts[(k + 1) % 4];
                const n = Math.hypot(e - a, f - b) * 7;
                for (let j = 0; j < n; j++) {
                    const t = j / n;
                    const x = px(a + (e - a) * t);
                    const y = pz(b + (f - b) * t);
                    const r = PX * (0.09 + rnd() * 0.06);
                    c.fillStyle = 'rgba(20,24,10,.35)';
                    c.beginPath();
                    c.arc(x + r * 0.6, y + r * 0.6, r, 0, Math.PI * 2);
                    c.fill();
                    c.fillStyle = rnd() < 0.5 ? '#34431f' : '#3f5026';
                    c.beginPath();
                    c.arc(x, y, r, 0, Math.PI * 2);
                    c.fill();
                }
            }
    }

    // Hjulspor som krysser landskapet.
    c.strokeStyle = look === 'ørken' ? 'rgba(120,95,60,.35)' : 'rgba(60,45,25,.28)';
    c.lineWidth = PX * 0.05;
    for (let i = 0; i < 9; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const x2 = x + (rnd() - 0.5) * PX * 12;
        const y2 = y + (rnd() - 0.5) * PX * 8;
        const cx = (x + x2) / 2 + (rnd() - 0.5) * PX * 4;
        const cy = (y + y2) / 2 + (rnd() - 0.5) * PX * 4;
        for (const o of [-0.17, 0.17]) {
            c.beginPath();
            c.moveTo(x + o * PX, y + o * PX);
            c.quadraticCurveTo(cx + o * PX, cy + o * PX, x2 + o * PX, y2 + o * PX);
            c.stroke();
        }
    }

    // Flyplassen: slått gress eller hardpakket sand, med hjulspor.
    const [fx, fz] = FLYPLASS;
    c.fillStyle = look === 'ørken' ? 'rgba(220,200,160,.7)' : 'rgba(150,160,100,.6)';
    c.fillRect(px(fx - 0.2), pz(fz - 2.3), 1.5 * PX, 3.2 * PX);
    c.strokeStyle = 'rgba(60,50,30,.3)';
    c.lineWidth = PX * 0.04;
    for (const o of [0.25, 0.85]) {
        c.beginPath();
        c.moveTo(px(fx + o), pz(fz - 2.2));
        c.lineTo(px(fx + o), pz(fz + 0.8));
        c.stroke();
    }

    // Elva (Rhinen): mørkt vann med lyse strømvirvler og gjørmete bredder.
    if (def.elv) {
        const [a, b] = def.elv;
        c.fillStyle = '#6b5f45';
        c.fillRect(px(a - 0.25), 0, (b - a + 0.5) * PX, H);
        c.fillStyle = '#3d4c4f';
        c.fillRect(px(a), 0, (b - a) * PX, H);
    }
    // Veiene: myk kant, kjørebane, hjulspor (brostein ved kysten).
    for (const road of def.veier) paintRoad(road);
    function paintRoad(road: [number, number][]) {
    const path = () => {
        c.beginPath();
        road.forEach(([x, z], i) => (i ? c.lineTo(px(x), pz(z)) : c.moveTo(px(x), pz(z))));
    };
    c.lineJoin = 'round';
    c.lineCap = 'round';
    path();
    c.strokeStyle = pal.dust;
    c.globalAlpha = 0.45;
    c.lineWidth = 1.25 * PX;
    c.stroke();
    c.globalAlpha = 1;
    path();
    c.strokeStyle = pal.road;
    c.lineWidth = 0.86 * PX;
    c.stroke();
    c.save();
    path();
    c.lineWidth = 0.86 * PX;
    // Klipp til veien: stein eller grus inni.
    const clip = new Path2D();
    for (let i = 1; i < road.length; i++) {
        const [a, b] = road[i - 1];
        const [e, f] = road[i];
        const minx = Math.min(a, e) - 0.43;
        const minz = Math.min(b, f) - 0.43;
        clip.rect(px(minx), pz(minz), (Math.abs(e - a) + 0.86) * PX, (Math.abs(f - b) + 0.86) * PX);
    }
    c.clip(clip);
    for (let i = 0; i < 2600; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const r = look === 'kyst' ? 2 + rnd() * 3 : 1 + rnd() * 1.5;
        c.fillStyle = rnd() < 0.5 ? 'rgba(40,35,28,.25)' : 'rgba(230,225,210,.18)';
        c.fillRect(x, y, r * 1.4, r);
    }
    c.restore();
    c.strokeStyle = pal.rut;
    c.globalAlpha = 0.55;
    c.lineWidth = PX * 0.07;
    for (const off of [-0.2, 0.2]) {
        c.save();
        c.translate(off * PX * 0.7, off * PX * 0.7);
        path();
        c.stroke();
        c.restore();
    }
    c.globalAlpha = 1;
    }

    // Kratre og svidde flekker fra tidligere kamper.
    for (const [cx, cz, cr] of craterSpots(def, look)) {
        const x = px(cx);
        const y = pz(cz);
        const r = cr * PX;
        soft(x, y, r * 2.4, look === 'ørken' ? '#7d6848' : '#3a3024', 0.4);
        c.fillStyle = 'rgba(45,35,25,.75)';
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = look === 'ørken' ? 'rgba(235,215,175,.55)' : 'rgba(160,140,100,.5)';
        c.lineWidth = r * 0.35;
        c.beginPath();
        c.arc(x, y, r * 1.05, Math.PI * 1.0, Math.PI * 1.9);
        c.stroke();
    }

    // Korn over alt.
    const pat = c.createPattern(noiseTile(rnd), 'repeat');
    if (pat) {
        c.globalCompositeOperation = 'overlay';
        c.globalAlpha = 0.14;
        c.fillStyle = pat;
        c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = 1;
    }

    // Utenfor kartet: litt mørkere, så spillbrettet står fram.
    c.fillStyle = 'rgba(18,20,12,.34)';
    c.beginPath();
    c.rect(0, 0, W, H);
    c.rect(px(0), pz(0), MAP_W * PX, MAP_D * PX);
    c.fill('evenodd');

    // Kartets kant og små kryss i rutenettet, så eleven ser hvor en enhet kan stå.
    c.fillStyle = 'rgba(255,250,230,.09)';
    const t = PX * 0.07;
    for (let x = 0; x <= MAP_W; x++)
        for (let z = 0; z <= MAP_D; z++) {
            c.fillRect(px(x) - t, pz(z) - 1, t * 2, 2);
            c.fillRect(px(x) - 1, pz(z) - t, 2, t * 2);
        }
    c.strokeStyle = 'rgba(255,248,220,.45)';
    c.lineWidth = 3;
    c.strokeRect(px(0), pz(0), MAP_W * PX, MAP_D * PX);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

// ---- Pynt utenfor kartet ---------------------------------------------------------------
type Spot = [number, number, number, number];
interface Deco {
    model: Model;
    at: Spot[];
    look: Look;
    elv?: [number, number];
}

const MODELS: Partial<Record<keyof typeof DECO, Model>> = {};
const deco = (k: keyof typeof DECO) => (MODELS[k] ??= DECO[k]());

function decoFor(def: SlagDef, detail: number): Deco[] {
    const look = LOOK[def.id] ?? 'kyst';
    const rnd = seeded(def.id.length * 131 + 7);
    const ring = (n: number, s0 = 0.8, s1 = 1.3): Spot[] => {
        const out: Spot[] = [];
        let guard = 0;
        while (out.length < Math.round(n * detail) && guard++ < 800) {
            const x = X0 + 1 + rnd() * (GW - 2);
            const z = Z0 + 1 + rnd() * (GD - 2);
            const inside = x > -0.5 && x < MAP_W + 0.5 && z > -0.5 && z < MAP_D + 0.5;
            const air = x > FLYPLASS[0] - 1.6 && x < FLYPLASS[0] + 2.4 && z > FLYPLASS[1] - 3 && z < FLYPLASS[1] + 1.4;
            const sea = look === 'kyst' && !def.elv && x < 0.3 && z < 7;
            const elv = def.elv && x > def.elv[0] - 0.6 && x < def.elv[1] + 0.6;
            if (!inside && !air && !sea && !elv) out.push([x, z, rnd() * Math.PI * 2, s0 + rnd() * (s1 - s0)]);
        }
        return out;
    };
    const tent: Spot[] = [[FLYPLASS[0] - 0.1, FLYPLASS[1] + 1.1, 0, 1]];
    const d = (k: keyof typeof DECO, at: Spot[]): Deco => ({ model: deco(k), at, look, elv: def.elv });
    if (look === 'kyst')
        return [
            d('tree', ring(18)),
            d('poplar', ring(8)),
            d('hedge', ring(16, 1, 1.4)),
            d('house', ring(6, 1, 1.2)),
            d('ruin', ring(2, 1, 1.2)),
            d('truck', ring(3, 1.2, 1.4)),
            d('pole', ring(5)),
            d('tent', tent),
            d('ship', def.elv ? [] : [[-4.4, -1.8, 0.3, 1.1], [-5.6, 2.2, -0.2, 1.2], [-3.4, 4.8, 0.5, 0.9], [-6, 5.6, 0.1, 1]]),
        ];
    if (look === 'ørken')
        return [
            d('palm', ring(5)),
            d('rock', ring(14, 0.8, 1.6)),
            d('scrub', ring(18, 0.8, 1.4)),
            d('sandbags', ring(8)),
            d('tent', [...tent, ...ring(3, 1, 1.2)]),
            d('truck', ring(4, 1.2, 1.4)),
        ];
    if (look === 'vinter')
        return [
            d('pine', ring(30, 0.9, 1.5)),
            d('house', ring(7, 1, 1.2)),
            d('ruin', ring(3, 1, 1.2)),
            d('truck', ring(3, 1.2, 1.4)),
            d('pole', ring(6)),
            d('tent', tent),
        ];
    return [
        d('birch', ring(18, 0.9, 1.4)),
        d('house', ring(5, 1, 1.2)),
        d('ruin', ring(3, 1, 1.2)),
        d('sheaf', ring(14)),
        d('truck', ring(3, 1.2, 1.4)),
        d('pole', ring(6)),
        d('tent', tent),
    ];
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();

function Instances({ d }: { d: Deco }) {
    const a = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const m = a.current;
        if (!m) return;
        d.at.forEach(([x, z, r, s], i) => {
            // Står på bakken der den er (åser og sanddyner); skipene ligger i vannet.
            const y = isSea(d.look, x, z, d.elv) ? WATER_Y - 0.03 : heightAt(d.look, x, z, d.elv) - 0.02;
            M.compose(P.set(x, y, z), Q.setFromEuler(E.set(0, r, 0)), S.setScalar(s * 1.3));
            m.setMatrixAt(i, M);
        });
        m.instanceMatrix.needsUpdate = true;
        m.computeBoundingSphere();
    }, [d]);
    if (!d.at.length) return null;
    return <instancedMesh ref={a} args={[d.model, figureMaterial(), d.at.length]} castShadow receiveShadow />;
}

export function Board({
    gRef,
    onPoint,
    onMove,
}: {
    gRef: React.MutableRefObject<G>;
    onPoint: (x: number, z: number) => void;
    onMove: (x: number, z: number) => void;
}) {
    const [slag, setSlag] = useState(0);
    const [tåke, setTåke] = useState(false);
    useFrame(() => {
        const g = gRef.current;
        if (g.slag !== slag) setSlag(g.slag);
        const t = (waveDef(g).sikt ?? 1) < 1;
        if (t !== tåke) setTåke(t);
    });
    const def = SLAG[slag];
    const look = LOOK[def.id] ?? 'kyst';
    const q = useQuality();
    const px = q.tier === 'lav' ? 48 : 72;
    const tex = useMemo(() => drawGround(def, px), [def, px]);
    const decos = useMemo(() => decoFor(def, q.detail), [def, q.detail]);
    const geo = useMemo(() => groundGeometry(look, X0, Z0, GW, GD, q.tier === 'lav' ? 3 : 4, def.elv), [look, q.tier, def]);
    const skirt = useMemo(() => new THREE.Color(GROUND[look].base).lerp(new THREE.Color('#12140c'), 0.34), [look]);
    const mat = useMemo(() => withClouds(new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }), look), [tex, look]);
    return (
        <group>
            <Lighting look={look} />
            <Haze look={look} tåke={tåke} />
            <mesh
                geometry={geo}
                material={mat}
                position={[X0 + GW / 2, -0.02, Z0 + GD / 2]}
                receiveShadow
                onPointerMove={(e: ThreeEvent<PointerEvent>) => onMove(e.point.x, e.point.z)}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    onPoint(e.point.x, e.point.z);
                }}
            />
            {/* Skjørtet: flat bakke i utkantfargen helt ut til kanten av bildet. */}
            <mesh rotation-x={-Math.PI / 2} position={[MAP_W / 2, SKIRT_Y - 0.02, MAP_D / 2]}>
                <planeGeometry args={[160, 160]} />
                <meshStandardMaterial color={skirt} roughness={1} />
            </mesh>
            <Water look={look} elv={def.elv} />
            {def.elv && <Bridges def={def} />}
            <BoardDetail def={def} look={look} detail={q.detail} />
            {decos.map((d, i) => (
                <Instances key={`${def.id}${i}`} d={d} />
            ))}
            <Hq def={def} look={look} gRef={gRef} />
        </group>
    );
}

/** Kommandovogna med antennelampe som blinker når nettet er oppe. Radioringen rundt den
 *  tegnes i bakken (`MARKS.uHq`), så den ligger over åsene. */
function Hq({ def, look, gRef }: { def: SlagDef; look: Look; gRef: React.MutableRefObject<G> }) {
    const [x, z] = def.hq;
    const tip = useRef<THREE.Mesh>(null);
    const model = useMemo(() => hqModel(look), [look]);
    const quat = useMemo(() => tilt(def, x, z, new THREE.Quaternion(), 0.8), [def, x, z]);
    useFrame((st) => {
        const on = usedChannels(gRef.current) > 0;
        if (tip.current) tip.current.visible = on && Math.sin(st.clock.elapsedTime * 7) > -0.2;
        MARKS.uHq.value.set(x, z, ringOf(gRef.current), 1);
    });
    return (
        <group position={[x, lift(def, x, z), z]} quaternion={quat}>
            <group scale={1.4}>
                <mesh geometry={model} material={figureMaterial()} castShadow receiveShadow />
                <mesh ref={tip} position={[-0.3, 2.08, 0.1]}>
                    <sphereGeometry args={[0.07, 8, 6]} />
                    <meshBasicMaterial color={C.radio} toneMapped={false} />
                </mesh>
            </group>
        </group>
    );
}
