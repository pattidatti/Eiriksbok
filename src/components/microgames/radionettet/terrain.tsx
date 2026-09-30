import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality, mergeParts } from '../kit';
import { RADIO } from './tuning';
import { MAP_D, MAP_W, FLYPLASS, SLAG, type SlagDef } from './levels';
import { usedChannels, type G } from './game';
import { C, HQ_MODEL, TREE, POPLAR, HOUSE, PALM, SANDBAGS, TENT, SHIP, type Model } from './models';

// Slagmarken som et trykt kart: bakke, åkre, veien og rasterprikker tegnes én gang i
// canvas per slag (ett draw call), og pynten utenfor kartet er instanser.

/** Bakken dekker kartet pluss en kant rundt. */
const X0 = -7;
const Z0 = -5;
const GW = MAP_W + 14;
const GD = MAP_D + 10;
const PX = 72;

type Look = 'kyst' | 'ørken' | 'steppe';
const LOOK: Record<string, Look> = { dunkerque: 'kyst', alamein: 'ørken', kursk: 'steppe' };

const GROUND: Record<Look, { base: string; fields: string[]; line: string }> = {
    kyst: { base: '#e3d7b1', fields: ['#d5cfa0', '#cfc896', '#ddd3a8', '#c7c38f'], line: '#4a5a30' },
    ørken: { base: '#ead3a0', fields: ['#e2c78e', '#efdcad', '#dcc088'], line: '#a8844e' },
    steppe: { base: '#e2d4a6', fields: ['#e5c86a', '#d9bf6a', '#cdbf8e', '#e9d38a'], line: '#7a6a3a' },
};

/** Fast tilfeldighet per slag, så kartet ser likt ut hver gang. */
function seeded(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

function drawGround(def: SlagDef) {
    const look = LOOK[def.id] ?? 'kyst';
    const pal = GROUND[look];
    const cv = document.createElement('canvas');
    cv.width = GW * PX;
    cv.height = GD * PX;
    const c = cv.getContext('2d')!;
    const px = (x: number) => (x - X0) * PX;
    const pz = (z: number) => (z - Z0) * PX;
    const rnd = seeded(def.id.length * 977 + 13);
    c.fillStyle = pal.base;
    c.fillRect(0, 0, cv.width, cv.height);

    // Åkre og flater: skjeve firkanter i få toner.
    if (look !== 'ørken') {
        c.globalAlpha = 0.6;
        for (let i = 0; i < 44; i++) {
            const x = X0 + rnd() * GW;
            const z = Z0 + rnd() * GD;
            const w = 1.5 + rnd() * 3;
            const d = 1.2 + rnd() * 2.4;
            const sk = (rnd() - 0.5) * 0.8;
            c.fillStyle = pal.fields[i % pal.fields.length];
            c.beginPath();
            c.moveTo(px(x), pz(z));
            c.lineTo(px(x + w), pz(z + sk));
            c.lineTo(px(x + w + sk), pz(z + d));
            c.lineTo(px(x + sk), pz(z + d - sk));
            c.closePath();
            c.fill();
            if (look === 'steppe' && i % 2 === 0) {
                // Kornåker: striper.
                c.save();
                c.clip();
                c.strokeStyle = 'rgba(122,106,58,.22)';
                c.lineWidth = 3;
                for (let k = -40; k < 40; k++) {
                    c.beginPath();
                    c.moveTo(px(x) + k * 14, pz(z));
                    c.lineTo(px(x) + k * 14 + 60, pz(z + d));
                    c.stroke();
                }
                c.restore();
            }
            if (look === 'kyst') {
                // Hekker langs kanten av åkeren.
                c.strokeStyle = pal.line;
                c.lineWidth = 4;
                c.stroke();
            }
        }
        c.globalAlpha = 1;
    } else {
        // Sanddyner: bølgete rygger med raster på skyggesiden.
        for (let i = 0; i < 26; i++) {
            const x = X0 + rnd() * GW;
            const z = Z0 + rnd() * GD;
            const w = 2 + rnd() * 3;
            c.fillStyle = pal.fields[i % pal.fields.length];
            c.beginPath();
            c.ellipse(px(x), pz(z), w * PX * 0.5, w * PX * 0.18, -0.25, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = pal.line;
            c.lineWidth = 3;
            c.beginPath();
            c.ellipse(px(x), pz(z), w * PX * 0.5, w * PX * 0.18, -0.25, Math.PI * 0.05, Math.PI * 0.95);
            c.stroke();
        }
    }

    // Havet ved Dunkerque: marineblått med trykte bølger og en strand.
    if (look === 'kyst') {
        c.fillStyle = '#e9dcb4';
        c.fillRect(0, 0, px(-0.3), pz(6.4));
        c.fillStyle = C.himmel;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(px(-1.1), 0);
        c.lineTo(px(-1.3), pz(3));
        c.lineTo(px(-1.2), pz(6));
        c.lineTo(0, pz(6.2));
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(239,228,201,.5)';
        c.lineWidth = 3;
        for (let i = 0; i < 40; i++) {
            const x = px(X0 + rnd() * 5.5);
            const z = pz(Z0 + rnd() * 10.5);
            c.beginPath();
            c.moveTo(x, z);
            c.quadraticCurveTo(x + 14, z - 8, x + 28, z);
            c.stroke();
        }
    }

    // Kratre fra tidligere kamper.
    const craters = look === 'kyst' ? 8 : 18;
    for (let i = 0; i < craters; i++) {
        const x = rnd() * MAP_W;
        const z = rnd() * MAP_D;
        const r = (0.12 + rnd() * 0.18) * PX;
        c.fillStyle = 'rgba(74,58,44,.35)';
        c.beginPath();
        c.arc(px(x), pz(z), r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(26,26,26,.45)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(px(x), pz(z), r, Math.PI * 0.9, Math.PI * 1.9);
        c.stroke();
    }

    // Flyplassen: stripe med stiplet midtlinje.
    const [fx, fz] = FLYPLASS;
    c.fillStyle = '#a89468';
    c.fillRect(px(fx - 0.65), pz(fz - 2.2), 2.4 * PX, 3 * PX);
    c.strokeStyle = C.papir;
    c.lineWidth = 5;
    c.setLineDash([18, 14]);
    c.beginPath();
    c.moveTo(px(fx + 0.55), pz(fz - 2.1));
    c.lineTo(px(fx + 0.55), pz(fz + 0.7));
    c.stroke();
    c.setLineDash([]);

    // Veien: bred stripe med sotkant og hjulspor.
    const road = def.vei;
    const path = () => {
        c.beginPath();
        road.forEach(([x, z], i) => (i ? c.lineTo(px(x), pz(z)) : c.moveTo(px(x), pz(z))));
    };
    c.lineJoin = 'round';
    c.lineCap = 'butt';
    path();
    c.strokeStyle = C.sot;
    c.lineWidth = 1.08 * PX;
    c.stroke();
    path();
    c.strokeStyle = C.vei;
    c.lineWidth = 0.96 * PX;
    c.stroke();
    c.strokeStyle = 'rgba(74,58,44,.45)';
    c.lineWidth = 4;
    c.setLineDash([22, 12]);
    for (const off of [-0.2, 0.2]) {
        c.save();
        c.translate(off * PX * 0.7, off * PX * 0.7);
        path();
        c.stroke();
        c.restore();
    }
    c.setLineDash([]);

    // Utenfor kartet: mørkere, som margen på et trykt kart. Spillbrettet står fram.
    c.fillStyle = 'rgba(42,63,120,.7)';
    c.beginPath();
    c.rect(0, 0, cv.width, cv.height);
    c.rect(px(0), pz(0), MAP_W * PX, MAP_D * PX);
    c.fill('evenodd');

    // Rasterprikkene: tettere nede mot høyre, som skyggen på en plakat.
    c.fillStyle = 'rgba(26,26,26,.2)';
    const step = 10;
    for (let y = 0; y < cv.height; y += step)
        for (let x = (y / step) % 2 ? step / 2 : 0; x < cv.width; x += step) {
            const inMap = x > px(0) && x < px(MAP_W) && y > pz(0) && y < pz(MAP_D);
            const k = (x / cv.width) * 0.55 + (y / cv.height) * 0.45;
            const r = Math.max(0, (k - (inMap ? 0.45 : 0.1)) * 4.2);
            if (r < 0.5) continue;
            c.beginPath();
            c.arc(x, y, Math.min(r, 3.4), 0, Math.PI * 2);
            c.fill();
        }

    // Kartets kant og rutenettet, så eleven ser hvor en enhet kan stå.
    c.fillStyle = 'rgba(26,26,26,.4)';
    for (let x = 0; x <= MAP_W; x++)
        for (let z = 0; z <= MAP_D; z++) {
            c.fillRect(px(x) - 7, pz(z) - 1.5, 14, 3);
            c.fillRect(px(x) - 1.5, pz(z) - 7, 3, 14);
        }
    c.strokeStyle = C.sot;
    c.lineWidth = 6;
    c.strokeRect(px(0), pz(0), MAP_W * PX, MAP_D * PX);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

// ---- Pynt utenfor kartet ---------------------------------------------------------------
interface Deco {
    model: Model;
    at: [number, number, number, number][];
}

function decoFor(def: SlagDef, detail: number): Deco[] {
    const look = LOOK[def.id] ?? 'kyst';
    const rnd = seeded(def.id.length * 131 + 7);
    const ring = (n: number) => {
        const out: [number, number, number, number][] = [];
        let guard = 0;
        while (out.length < Math.round(n * detail) && guard++ < 500) {
            const x = X0 + 1 + rnd() * (GW - 2);
            const z = Z0 + 1 + rnd() * (GD - 2);
            const inside = x > -0.4 && x < MAP_W + 0.4 && z > -0.4 && z < MAP_D + 0.4;
            const air = x > FLYPLASS[0] - 1.6 && x < FLYPLASS[0] + 2.4 && z > FLYPLASS[1] - 3 && z < FLYPLASS[1] + 1.4;
            const sea = look === 'kyst' && x < -0.2 && z < 6.6;
            if (!inside && !air && !sea) out.push([x, z, rnd() * Math.PI * 2, 0.8 + rnd() * 0.5]);
        }
        return out;
    };
    const tent: [number, number, number, number][] = [[FLYPLASS[0] - 0.1, FLYPLASS[1] + 1.1, 0, 1]];
    if (look === 'kyst')
        return [
            { model: TREE, at: ring(22) },
            { model: POPLAR, at: ring(10) },
            { model: HOUSE, at: ring(7) },
            { model: TENT, at: tent },
            { model: SHIP, at: [[-4.2, -1.5, 0.3, 1], [-5.5, 2, -0.2, 1.1], [-3.2, 4.4, 0.5, 0.8]] },
        ];
    if (look === 'ørken')
        return [
            { model: PALM, at: ring(8) },
            { model: SANDBAGS, at: ring(10) },
            { model: TENT, at: [...tent, ...ring(3)] },
        ];
    return [
        { model: POPLAR, at: ring(16) },
        { model: HOUSE, at: ring(9) },
        { model: TENT, at: tent },
    ];
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();

function Instances({ d }: { d: Deco }) {
    const a = useRef<THREE.InstancedMesh>(null);
    const b = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        d.at.forEach(([x, z, r, s], i) => {
            M.compose(P.set(x, 0, z), Q.setFromEuler(E.set(0, r, 0)), S.setScalar(s * 1.3));
            a.current?.setMatrixAt(i, M);
            b.current?.setMatrixAt(i, M);
        });
        for (const m of [a.current, b.current]) if (m) m.instanceMatrix.needsUpdate = true;
    }, [d]);
    if (!d.at.length) return null;
    return (
        <>
            <instancedMesh ref={a} args={[d.model.body, undefined, d.at.length]}>
                <meshBasicMaterial vertexColors toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={b} args={[d.model.hull, undefined, d.at.length]}>
                <meshBasicMaterial color={C.sot} side={THREE.BackSide} toneMapped={false} />
            </instancedMesh>
        </>
    );
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
    useFrame(() => {
        if (gRef.current.slag !== slag) setSlag(gRef.current.slag);
    });
    const def = SLAG[slag];
    const q = useQuality();
    const tex = useMemo(() => drawGround(def), [def]);
    const deco = useMemo(() => decoFor(def, q.detail), [def, q.detail]);
    return (
        <group>
            <mesh
                rotation-x={-Math.PI / 2}
                position={[X0 + GW / 2, -0.02, Z0 + GD / 2]}
                onPointerMove={(e: ThreeEvent<PointerEvent>) => onMove(e.point.x, e.point.z)}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    onPoint(e.point.x, e.point.z);
                }}
            >
                <planeGeometry args={[GW, GD]} />
                <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
            {deco.map((d, i) => (
                <Instances key={`${def.id}${i}`} d={d} />
            ))}
            <Hq def={def} gRef={gRef} />
        </group>
    );
}

function Figure({ m }: { m: Model }) {
    return (
        <>
            <mesh geometry={m.body}>
                <meshBasicMaterial vertexColors toneMapped={false} />
            </mesh>
            <mesh geometry={m.hull}>
                <meshBasicMaterial color={C.sot} side={THREE.BackSide} toneMapped={false} />
            </mesh>
        </>
    );
}

/** Kommandovogna med antenne som blinker når nettet er oppe, og radioringen stiplet rundt. */
/** Radioringen: stiplet, én geometri. */
const RING = mergeParts(
    Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        return {
            geometry: new THREE.PlaneGeometry(0.1, 0.42),
            position: [Math.cos(a) * RADIO.rekkevidde, 0.02, Math.sin(a) * RADIO.rekkevidde] as [number, number, number],
            rotation: [-Math.PI / 2, 0, -a] as [number, number, number],
            color: C.radio,
        };
    })
);

function Hq({ def, gRef }: { def: SlagDef; gRef: React.MutableRefObject<G> }) {
    const [x, z] = def.hq;
    const tip = useRef<THREE.Mesh>(null);
    const ring = useRef<THREE.Group>(null);
    useFrame((st) => {
        const on = usedChannels(gRef.current) > 0;
        if (tip.current) tip.current.visible = on && Math.sin(st.clock.elapsedTime * 7) > -0.2;
        if (ring.current) ring.current.rotation.y = st.clock.elapsedTime * 0.05;
    });
    return (
        <group position={[x, 0, z]}>
            <group scale={1.4}>
                <Figure m={HQ_MODEL} />
                <mesh ref={tip} position={[-0.3, 2.08, 0.1]}>
                    <octahedronGeometry args={[0.1]} />
                    <meshBasicMaterial color={C.radio} toneMapped={false} />
                </mesh>
            </group>
            <group ref={ring}>
                <mesh geometry={RING}>
                    <meshBasicMaterial vertexColors toneMapped={false} />
                </mesh>
            </group>
        </group>
    );
}
