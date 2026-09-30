import * as THREE from 'three';
import { mergeParts, type Part } from '../kit/mergeParts';
import type { EnemyKind, TowerKind } from './game';

// Figurene og tårnene i Løpegravene: tunge lavpoly-former med farger i hjørnene,
// slått sammen til én geometri per ting (ett draw call per type). Gangen er ikke et
// skjelett, men en svai i vertex-shaderen (bein og armer svinger rundt hofte og skulder).

// ---------------------------------------------------------------------------
// Palett (kunstbriefen)
// ---------------------------------------------------------------------------

export const COL = {
    blue: '#3a64b4',
    blueDark: '#2a4c8e',
    yellow: '#e3b53b',
    buff: '#d4c08c',
    boot: '#1a1818',
    skin: '#e2b596',
    hat: '#16161b',
    wood: '#5a3b22',
    woodDark: '#3e2716',
    timber: '#7a5534',
    steel: '#a7b0ba',
    red: '#9c2b25',
    redDark: '#6e1d19',
    grey: '#8d8a86',
    white: '#ebe6da',
    stone: '#6a6c7e',
    stoneDark: '#57545b',
    snow: '#b4c4e6',
    earth: '#4a3a2c',
    bronze: '#9a7434',
    iron: '#2b2c31',
    wicker: '#8a6a3a',
    gold: '#f2c14e',
};

type V3 = [number, number, number];

const box = (w: number, h: number, d: number, p: V3, color: string, r?: V3): Part => ({
    geometry: new THREE.BoxGeometry(w, h, d),
    position: p,
    rotation: r,
    color,
});
const cyl = (rt: number, rb: number, h: number, p: V3, color: string, r?: V3, seg = 8): Part => ({
    geometry: new THREE.CylinderGeometry(rt, rb, h, seg),
    position: p,
    rotation: r,
    color,
});
const cone = (rad: number, h: number, p: V3, color: string, seg = 6, r?: V3): Part => ({
    geometry: new THREE.ConeGeometry(rad, h, seg),
    position: p,
    rotation: r,
    color,
});
const ball = (rad: number, p: V3, color: string): Part => ({
    geometry: new THREE.IcosahedronGeometry(rad, 0),
    position: p,
    color,
});

// ---------------------------------------------------------------------------
// Soldater
// ---------------------------------------------------------------------------

interface Soldier {
    coat: string;
    facing: string;
    legs: string;
    boots?: string;
    musket?: boolean;
    x?: number;
    z?: number;
    y?: number;
    yaw?: number;
    kneel?: boolean;
    sword?: boolean;
    belts?: string;
    hat?: 'tricorn' | 'mitre' | 'cap' | null;
}

/** En stående soldat, føttene i y = 0, ansiktet mot +z. Hofte 0,2, skulder 0,4. */
function soldier(o: Soldier): Part[] {
    const ox = o.x ?? 0;
    const oz = o.z ?? 0;
    const oy = o.y ?? 0;
    const k = o.kneel ? 0.7 : 1;
    const P = (x: number, y: number, z: number): V3 => [ox + x, oy + y * k, oz + z];
    const parts: Part[] = [
        box(0.07, 0.09, 0.09, P(-0.05, 0.045, 0.01), o.boots ?? COL.boot),
        box(0.07, 0.09, 0.09, P(0.05, 0.045, 0.01), o.boots ?? COL.boot),
        box(0.075, 0.12, 0.08, P(-0.05, 0.14, 0), o.legs),
        box(0.075, 0.12, 0.08, P(0.05, 0.14, 0), o.legs),
        box(0.23, 0.1, 0.15, P(0, 0.23, 0), o.coat), // rokkeskjørt
        box(0.2, 0.19, 0.13, P(0, 0.33, 0), o.coat),
        box(0.1, 0.17, 0.014, P(0, 0.33, 0.07), o.facing), // oppslag
        box(0.21, 0.035, 0.14, P(0, 0.41, 0), o.facing), // krage
        box(0.065, 0.17, 0.075, P(-0.135, 0.33, 0), o.coat),
        box(0.065, 0.17, 0.075, P(0.135, 0.33, 0), o.coat),
        box(0.07, 0.045, 0.08, P(-0.135, 0.255, 0), o.facing), // mansjetter
        box(0.07, 0.045, 0.08, P(0.135, 0.255, 0), o.facing),
        box(0.035, 0.035, 0.035, P(-0.135, 0.22, 0), COL.skin),
        box(0.035, 0.035, 0.035, P(0.135, 0.22, 0), COL.skin),
        box(0.105, 0.11, 0.1, P(0, 0.48, 0), COL.skin),
        box(0.11, 0.04, 0.05, P(0, 0.5, -0.04), '#6d5a45'), // hår i nakken
    ];
    if (o.belts) {
        parts.push(box(0.042, 0.21, 0.012, P(-0.05, 0.33, 0.07), o.belts, [0, 0, 0.5]));
        parts.push(box(0.042, 0.21, 0.012, P(0.05, 0.33, 0.07), o.belts, [0, 0, -0.5]));
    }
    if (o.musket) {
        parts.push(box(0.025, 0.025, 0.42, P(0.1, 0.44, -0.02), COL.wood, [-1.05, 0, 0]));
        parts.push(box(0.012, 0.012, 0.14, P(0.1, 0.66, 0.1), COL.steel, [-1.05, 0, 0]));
    }
    if (o.sword) {
        parts.push(box(0.02, 0.36, 0.02, P(0.15, 0.56, 0.06), COL.steel, [0.35, 0, -0.15]));
        parts.push(box(0.07, 0.02, 0.03, P(0.15, 0.39, 0.02), COL.gold));
    }
    if (o.hat === 'tricorn') parts.push(...tricornParts(P(0, 0.545, 0)));
    else if (o.hat === 'mitre') parts.push(...mitreParts(P(0, 0.54, 0)));
    else if (o.hat === 'cap') parts.push(box(0.12, 0.04, 0.12, P(0, 0.55, 0), '#4b3d2e'));
    if (o.yaw)
        for (const p of parts) {
            const m = new THREE.Matrix4().makeRotationY(o.yaw);
            p.geometry.applyMatrix4(
                new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...(p.rotation ?? [0, 0, 0])))
            );
            p.rotation = undefined;
            const v = new THREE.Vector3(...(p.position ?? [0, 0, 0])).sub(new THREE.Vector3(ox, 0, oz));
            v.applyMatrix4(m).add(new THREE.Vector3(ox, 0, oz));
            p.geometry.applyMatrix4(m);
            p.position = [v.x, v.y, v.z];
        }
    return parts;
}

function tricornParts(p: V3, color = COL.hat, trim?: string): Part[] {
    const out: Part[] = [
        { geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.035, 3), position: [p[0], p[1], p[2]], rotation: [0, Math.PI, 0], color },
        { geometry: new THREE.CylinderGeometry(0.05, 0.065, 0.06, 6), position: [p[0], p[1] + 0.03, p[2]], color },
    ];
    if (trim) out.push({ geometry: new THREE.CylinderGeometry(0.104, 0.104, 0.012, 3), position: [p[0], p[1] + 0.02, p[2]], rotation: [0, Math.PI, 0], color: trim });
    return out;
}
function mitreParts(p: V3): Part[] {
    return [
        box(0.1, 0.16, 0.08, [p[0], p[1] + 0.06, p[2]], COL.blue),
        box(0.1, 0.16, 0.01, [p[0], p[1] + 0.06, p[2] + 0.045], COL.yellow),
        ball(0.025, [p[0], p[1] + 0.15, p[2]], COL.yellow),
    ];
}

// ---------------------------------------------------------------------------
// Fiendene (en geometri per type) - hattene er egne, så de kan fly av
// ---------------------------------------------------------------------------

export interface FigureDef {
    geo: THREE.BufferGeometry;
    /** 0 = to bein, 1 = hest, 2 = bare mannskapet bak kanonen svinger. */
    mode: 0 | 1 | 2;
    hip: number;
    shoulder: number;
    /** Hvor hatten sitter (lokal y), og hvilken hatt. */
    hatY: number;
    hat: 'tricorn' | 'mitre' | null;
    scale: number;
    /** Hvor mange som kan være på brettet samtidig (levende + falne). */
    max: number;
}

/**
 * Hvor store figurene er. Store nok til at man ser blå frakker med gule oppslag som
 * faller - hodene og skuldrene stikker opp over grøftekanten.
 */
export const FIG_SCALE: Record<EnemyKind, number> = {
    karoliner: 1.85,
    graver: 1.85,
    rytter: 1.7,
    grenader: 1.88,
    beleiring: 1.75,
    livgarde: 1.92,
    karl: 2.45,
};

let _figs: Record<EnemyKind, FigureDef> | null = null;
export function figures(): Record<EnemyKind, FigureDef> {
    if (_figs) return _figs;
    const karoliner = mergeParts(
        soldier({ coat: COL.blue, facing: COL.yellow, legs: COL.buff, musket: true, belts: COL.white })
    );
    const graver = mergeParts([
        ...soldier({ coat: '#5f5242', facing: '#7a6a52', legs: '#6b5c49', hat: 'cap' }),
        cyl(0.15, 0.15, 0.3, [0, 0.26, 0.2], COL.wicker, undefined, 9),
        cyl(0.14, 0.14, 0.02, [0, 0.415, 0.2], COL.earth, undefined, 9),
        box(0.03, 0.34, 0.02, [-0.1, 0.36, -0.1], COL.wood, [0.3, 0, 0.2]),
        box(0.09, 0.1, 0.015, [-0.13, 0.55, -0.14], COL.steel, [0.3, 0, 0.2]),
    ]);
    const horse: Part[] = [
        box(0.16, 0.15, 0.44, [0, 0.33, 0], '#3a2a20'),
        box(0.1, 0.18, 0.1, [0, 0.46, 0.22], '#3a2a20', [0.5, 0, 0]),
        box(0.08, 0.08, 0.16, [0, 0.54, 0.31], '#3a2a20'),
        box(0.05, 0.14, 0.05, [0, 0.26, -0.24], '#1d1510', [-0.5, 0, 0]),
        ...[
            [-0.05, 0.15],
            [0.05, 0.15],
            [-0.05, -0.15],
            [0.05, -0.15],
        ].map(([x, z]) => box(0.05, 0.26, 0.05, [x, 0.13, z], '#2c2019')),
        box(0.18, 0.02, 0.16, [0, 0.415, -0.02], COL.yellow), // schabrak
        // rytteren
        box(0.18, 0.18, 0.12, [0, 0.52, -0.02], COL.blueDark),
        box(0.06, 0.13, 0.07, [-0.11, 0.5, 0.02], COL.blueDark),
        box(0.06, 0.13, 0.07, [0.11, 0.5, 0.02], COL.blueDark),
        box(0.05, 0.12, 0.06, [-0.1, 0.4, 0.02], COL.boot),
        box(0.05, 0.12, 0.06, [0.1, 0.4, 0.02], COL.boot),
        box(0.1, 0.1, 0.09, [0, 0.66, -0.02], COL.skin),
        box(0.02, 0.36, 0.02, [0.14, 0.66, 0.08], COL.steel, [0.7, 0, 0]),
    ];
    const rytter = mergeParts(horse);
    const grenader = mergeParts([
        ...soldier({ coat: COL.blue, facing: COL.yellow, legs: COL.buff, belts: COL.white }),
        ball(0.04, [0.15, 0.24, 0.05], '#111'),
    ]);
    const beleiring = mergeParts([
        box(0.26, 0.1, 0.62, [0, 0.2, -0.02], COL.woodDark),
        box(0.06, 0.16, 0.5, [-0.11, 0.28, 0], COL.wood),
        box(0.06, 0.16, 0.5, [0.11, 0.28, 0], COL.wood),
        cyl(0.07, 0.085, 0.72, [0, 0.38, 0.12], COL.bronze, [Math.PI / 2 - 0.12, 0, 0], 10),
        cyl(0.09, 0.09, 0.05, [0, 0.36, -0.21], COL.bronze, [Math.PI / 2, 0, 0], 10),
        box(0.34, 0.03, 0.03, [0, 0.14, -0.3], COL.wood), // dragstang
        // mannskapet som dytter
        ...soldier({ coat: COL.blue, facing: COL.yellow, legs: COL.buff, z: -0.46, x: -0.12, hat: 'tricorn' }),
        ...soldier({ coat: COL.blue, facing: COL.yellow, legs: COL.buff, z: -0.46, x: 0.12, hat: 'tricorn' }),
    ]);
    const livgarde = mergeParts(
        soldier({ coat: COL.blueDark, facing: COL.gold, legs: COL.buff, musket: true, belts: COL.white })
    );
    const karl = mergeParts(
        soldier({ coat: '#3a60aa', facing: '#e3c07a', legs: '#c9a46a', boots: '#111', sword: true, belts: '#c9a46a' })
    );
    _figs = {
        karoliner: { geo: karoliner, mode: 0, hip: 0.2, shoulder: 0.42, hatY: 0.545, hat: 'tricorn', scale: FIG_SCALE.karoliner, max: 190 },
        graver: { geo: graver, mode: 0, hip: 0.2, shoulder: 0.42, hatY: 0, hat: null, scale: FIG_SCALE.graver, max: 60 },
        rytter: { geo: rytter, mode: 1, hip: 0.26, shoulder: 0, hatY: 0.72, hat: 'tricorn', scale: FIG_SCALE.rytter, max: 60 },
        grenader: { geo: grenader, mode: 0, hip: 0.2, shoulder: 0.42, hatY: 0.54, hat: 'mitre', scale: FIG_SCALE.grenader, max: 60 },
        beleiring: { geo: beleiring, mode: 2, hip: 0.2, shoulder: 0.42, hatY: 0, hat: null, scale: FIG_SCALE.beleiring, max: 10 },
        livgarde: { geo: livgarde, mode: 0, hip: 0.2, shoulder: 0.42, hatY: 0.545, hat: 'tricorn', scale: FIG_SCALE.livgarde, max: 40 },
        karl: { geo: karl, mode: 0, hip: 0.2, shoulder: 0.42, hatY: 0.545, hat: 'tricorn', scale: FIG_SCALE.karl, max: 2 },
    };
    return _figs;
}

let _hats: { tricorn: THREE.BufferGeometry; mitre: THREE.BufferGeometry; wheel: THREE.BufferGeometry } | null = null;
export function hatGeos() {
    if (_hats) return _hats;
    const spokes: Part[] = [];
    for (let i = 0; i < 4; i++)
        spokes.push(box(0.02, 0.25, 0.015, [0, 0, 0], COL.wood, [0, 0, (i * Math.PI) / 4]));
    _hats = {
        tricorn: mergeParts(tricornParts([0, 0, 0])),
        mitre: mergeParts(mitreParts([0, -0.06, 0])),
        wheel: mergeParts([
            { geometry: new THREE.TorusGeometry(0.13, 0.022, 4, 12), color: COL.woodDark },
            ...spokes,
            cyl(0.03, 0.03, 0.05, [0, 0, 0], COL.iron, [0, 0, Math.PI / 2]),
        ]).rotateY(Math.PI / 2),
    };
    return _hats;
}

// ---------------------------------------------------------------------------
// Tårnene: tre nivåer som ser forskjellige ut. `base` står stille, `top` dreier mot målet.
// ---------------------------------------------------------------------------

export interface TowerModel {
    base: THREE.BufferGeometry;
    top: THREE.BufferGeometry | null;
    /** Høyden der toppen står og munningen er (lokal). */
    topY: number;
    muzzle: V3;
    /** Hvor stort stillaset er. */
    size: number;
}

const defender = (x: number, z: number, y = 0, yaw = 0, kneel = false) =>
    soldier({ coat: COL.red, facing: COL.white, legs: COL.grey, musket: true, x, z, y, yaw, kneel, hat: 'tricorn' });

function gabion(x: number, z: number, y = 0, s = 1): Part[] {
    return [
        cyl(0.1 * s, 0.1 * s, 0.2 * s, [x, y + 0.1 * s, z], COL.wicker, undefined, 7),
        cyl(0.092 * s, 0.092 * s, 0.02, [x, y + 0.205 * s, z], COL.earth, undefined, 7),
    ];
}

function flag(x: number, y: number, z: number, h: number): Part[] {
    // Dannebrog: Danmark-Norge i 1718.
    return [
        cyl(0.012, 0.012, h, [x, y + h / 2, z], COL.woodDark),
        box(0.26, 0.16, 0.012, [x + 0.13, y + h - 0.09, z], COL.red),
        box(0.26, 0.03, 0.014, [x + 0.13, y + h - 0.09, z], COL.white),
        box(0.03, 0.16, 0.014, [x + 0.08, y + h - 0.09, z], COL.white),
    ];
}

function cannon(len: number, r: number, y: number, z = 0, x = 0): Part[] {
    return [
        box(0.18, 0.08, 0.34, [x, y + 0.06, z - 0.02], COL.woodDark),
        cyl(0.09, 0.09, 0.04, [x - 0.11, y + 0.07, z - 0.06], COL.wood, [0, 0, Math.PI / 2], 8),
        cyl(0.09, 0.09, 0.04, [x + 0.11, y + 0.07, z - 0.06], COL.wood, [0, 0, Math.PI / 2], 8),
        cyl(r * 0.8, r, len, [x, y + 0.14, z + len * 0.25], COL.iron, [Math.PI / 2, 0, 0], 8),
        cyl(r * 1.05, r * 1.05, 0.04, [x, y + 0.14, z + len * 0.73], COL.iron, [Math.PI / 2, 0, 0], 8),
    ];
}

function mortar(y: number, s: number, x = 0, z = 0): Part[] {
    return [
        box(0.28 * s, 0.08 * s, 0.3 * s, [x, y + 0.04 * s, z], COL.woodDark),
        cyl(0.1 * s, 0.13 * s, 0.24 * s, [x, y + 0.16 * s, z + 0.03 * s], COL.bronze, [0.75, 0, 0], 9),
        cyl(0.115 * s, 0.115 * s, 0.03 * s, [x, y + 0.24 * s, z + 0.1 * s], COL.iron, [0.75, 0, 0], 9),
    ];
}

function bombPile(x: number, z: number, y = 0): Part[] {
    return [
        ball(0.05, [x - 0.05, y + 0.05, z], '#111'),
        ball(0.05, [x + 0.05, y + 0.05, z], '#111'),
        ball(0.05, [x, y + 0.05, z + 0.07], '#111'),
        ball(0.05, [x, y + 0.12, z + 0.02], '#111'),
    ];
}

function palisade(w: number, y: number): Part[] {
    const out: Part[] = [];
    for (let i = 0; i < 7; i++) {
        const x = -w / 2 + (i * w) / 6;
        out.push(cyl(0.035, 0.035, 0.3, [x, y + 0.15, 0.36], COL.timber, [0.2, 0, 0], 5));
        out.push(cone(0.035, 0.07, [x, y + 0.33, 0.39], COL.timber, 5, [0.2, 0, 0]));
    }
    for (let i = 0; i < 4; i++) {
        const z = -0.3 + i * 0.2;
        out.push(cyl(0.035, 0.035, 0.26, [-w / 2, y + 0.13, z], COL.timber, undefined, 5));
        out.push(cyl(0.035, 0.035, 0.26, [w / 2, y + 0.13, z], COL.timber, undefined, 5));
    }
    return out;
}

function stoneRing(r: number, h: number, seg = 8): Part[] {
    return [
        cyl(r, r * 1.08, h, [0, h / 2, 0], COL.stone, undefined, seg),
        cyl(r * 1.02, r * 1.02, 0.03, [0, h + 0.015, 0], COL.snow, undefined, seg),
        cyl(r * 0.8, r * 0.8, 0.02, [0, h + 0.02, 0], COL.stoneDark, undefined, seg),
    ];
}

let _towers: Record<TowerKind, TowerModel[]> | null = null;
export function towerModels(): Record<TowerKind, TowerModel[]> {
    if (_towers) return _towers;
    const M = mergeParts;
    const musketer: TowerModel[] = [
        {
            base: M([
                ...gabion(-0.25, 0.22),
                ...gabion(0, 0.3),
                ...gabion(0.25, 0.22),
                box(0.78, 0.05, 0.62, [0, 0.025, 0], COL.earth),
                ...flag(-0.34, 0.04, -0.26, 0.85),
            ]),
            top: M([
                ...defender(-0.2, 0.02, 0.03, 0, true),
                ...defender(0.02, 0.06, 0.03, 0, true),
                ...defender(0.22, -0.04, 0.03),
            ]),
            topY: 0,
            muzzle: [0, 0.45, 0.35],
            size: 0.8,
        },
        {
            base: M([
                box(0.84, 0.16, 0.8, [0, 0.08, 0], COL.timber),
                box(0.86, 0.02, 0.82, [0, 0.17, 0], COL.snow),
                ...palisade(0.8, 0.16),
                ...flag(-0.34, 0.16, -0.3, 0.8),
            ]),
            top: M([
                ...defender(-0.2, 0.05, 0, 0, true),
                ...defender(0, 0.1, 0, 0, true),
                ...defender(0.2, 0.05, 0, 0, true),
            ]),
            topY: 0.18,
            muzzle: [0, 0.4, 0.4],
            size: 0.95,
        },
        {
            base: M([
                box(0.82, 0.42, 0.82, [0, 0.21, 0], COL.timber),
                box(0.84, 0.04, 0.84, [0, 0.12, 0], COL.woodDark),
                box(0.84, 0.04, 0.84, [0, 0.3, 0], COL.woodDark),
                box(0.12, 0.04, 0.02, [-0.2, 0.26, 0.42], '#111'),
                box(0.12, 0.04, 0.02, [0.2, 0.26, 0.42], '#111'),
                box(0.02, 0.04, 0.12, [0.42, 0.26, 0], '#111'),
                box(0.02, 0.04, 0.12, [-0.42, 0.26, 0], '#111'),
                box(0.92, 0.05, 0.92, [0, 0.445, 0], COL.woodDark),
                box(0.9, 0.02, 0.9, [0, 0.475, 0], COL.snow),
                ...flag(-0.36, 0.47, -0.36, 1.0),
            ]),
            top: M([
                ...defender(-0.22, 0.1, 0),
                ...defender(0, 0.18, 0, 0, true),
                ...defender(0.22, 0.1, 0),
                ...defender(0.08, -0.15, 0),
            ]),
            topY: 0.48,
            muzzle: [0, 0.4, 0.4],
            size: 1.05,
        },
    ];
    const kanon: TowerModel[] = [
        {
            base: M([
                box(0.62, 0.12, 0.92, [0, 0.06, -0.02], COL.earth),
                box(0.64, 0.02, 0.94, [0, 0.125, -0.02], '#8a7a66'),
                ...gabion(-0.26, 0.3),
                ...gabion(0.26, 0.3),
                ...gabion(-0.26, 0.08),
                ...gabion(0.26, 0.08),
            ]),
            top: M([...cannon(0.8, 0.075, 0.12)]),
            topY: 0,
            muzzle: [0, 0.26, 0.62],
            size: 0.85,
        },
        {
            base: M([
                box(0.9, 0.2, 0.9, [0, 0.1, 0], COL.timber),
                box(0.92, 0.02, 0.92, [0, 0.21, 0], COL.snow),
                box(0.26, 0.2, 0.2, [-0.32, 0.3, 0.34], COL.earth),
                box(0.26, 0.2, 0.2, [0.32, 0.3, 0.34], COL.earth),
                box(0.26, 0.02, 0.2, [-0.32, 0.41, 0.34], COL.snow),
                box(0.26, 0.02, 0.2, [0.32, 0.41, 0.34], COL.snow),
                ...gabion(-0.36, -0.3, 0.2),
            ]),
            top: M([
                ...cannon(0.85, 0.08, 0.02),
                ...soldier({ coat: COL.red, facing: COL.white, legs: COL.grey, x: 0.2, z: -0.28, hat: 'tricorn' }),
            ]),
            topY: 0.2,
            muzzle: [0, 0.2, 0.6],
            size: 1,
        },
        {
            base: M([...stoneRing(0.5, 0.36, 8), ...flag(-0.4, 0.36, -0.3, 0.9)]),
            top: M([
                ...cannon(0.85, 0.078, 0.02, 0.02, -0.17),
                ...cannon(0.85, 0.078, 0.02, 0.02, 0.17),
                ...soldier({ coat: COL.red, facing: COL.white, legs: COL.grey, x: 0, z: -0.34, hat: 'tricorn' }),
            ]),
            topY: 0.38,
            muzzle: [0, 0.2, 0.6],
            size: 1.1,
        },
    ];
    const morter: TowerModel[] = [
        {
            base: M([
                cyl(0.42, 0.46, 0.06, [0, 0.03, 0], '#241a13', undefined, 12),
                ...[0, 1, 2, 3, 4, 5, 6].map((i) => gabion(Math.sin(i * 0.9 - 2.7) * 0.36, Math.cos(i * 0.9 - 2.7) * 0.36)).flat(),
                ...bombPile(0.2, -0.16, 0.04),
            ]),
            top: M([...mortar(0.06, 1.55)]),
            topY: 0,
            muzzle: [0, 0.44, 0.18],
            size: 0.85,
        },
        {
            base: M([
                box(0.9, 0.12, 0.9, [0, 0.06, 0], COL.earth),
                box(0.9, 0.22, 0.08, [0, 0.11, 0.42], COL.timber),
                box(0.08, 0.22, 0.9, [-0.42, 0.11, 0], COL.timber),
                box(0.08, 0.22, 0.9, [0.42, 0.11, 0], COL.timber),
                ...bombPile(0.28, -0.26, 0.12),
            ]),
            top: M([...mortar(0.12, 1.65)]),
            topY: 0,
            muzzle: [0, 0.5, 0.2],
            size: 1,
        },
        {
            base: M([
                ...stoneRing(0.5, 0.26, 10),
                ...bombPile(0.28, -0.3, 0.28),
                cyl(0.07, 0.07, 0.14, [-0.3, 0.35, -0.3], COL.wood, undefined, 8),
            ]),
            top: M([...mortar(0.28, 1.25, -0.16, 0.05), ...mortar(0.28, 1.25, 0.16, 0.05)]),
            topY: 0,
            muzzle: [0, 0.55, 0.2],
            size: 1.1,
        },
    ];
    const mine: TowerModel[] = [
        {
            base: M([
                cyl(0.18, 0.26, 0.1, [0, 0.05, 0], '#5b4632', undefined, 7),
                cyl(0.01, 0.01, 0.18, [0.06, 0.18, 0], COL.wood),
            ]),
            top: null,
            topY: 0,
            muzzle: [0.06, 0.28, 0],
            size: 0.55,
        },
        {
            base: M([
                cyl(0.22, 0.3, 0.12, [0, 0.06, 0], '#5b4632', undefined, 8),
                cyl(0.08, 0.08, 0.14, [0.1, 0.16, 0.05], COL.wood, undefined, 8),
                cyl(0.01, 0.01, 0.2, [-0.08, 0.2, 0], COL.wood),
            ]),
            top: null,
            topY: 0,
            muzzle: [-0.08, 0.3, 0],
            size: 0.6,
        },
        {
            base: M([
                cyl(0.26, 0.32, 0.12, [0, 0.06, 0], '#5b4632', undefined, 8),
                box(0.05, 0.28, 0.05, [-0.18, 0.14, -0.14], COL.timber),
                box(0.05, 0.28, 0.05, [0.18, 0.14, -0.14], COL.timber),
                box(0.42, 0.05, 0.06, [0, 0.29, -0.14], COL.timber),
                cyl(0.08, 0.08, 0.14, [0.08, 0.17, 0.08], COL.wood, undefined, 8),
                cyl(0.08, 0.08, 0.14, [-0.08, 0.17, 0.1], COL.wood, undefined, 8),
            ]),
            top: null,
            topY: 0,
            muzzle: [0, 0.34, -0.14],
            size: 0.7,
        },
    ];
    _towers = { musketer, kanon, morter, mine };
    return _towers;
}

/** Stillaset rundt et tårn som bygges: stolper, planker og skråstag. */
let _scaffold: THREE.BufferGeometry | null = null;
export function scaffoldGeo() {
    if (_scaffold) return _scaffold;
    const p: Part[] = [];
    const s = 0.46;
    for (const x of [-s, s])
        for (const z of [-s, s]) p.push(cyl(0.022, 0.022, 1.0, [x, 0.5, z], COL.timber, undefined, 4));
    for (const y of [0.33, 0.7]) {
        p.push(box(2 * s + 0.08, 0.03, 0.12, [0, y, s], '#a57c4f'));
        p.push(box(2 * s + 0.08, 0.03, 0.12, [0, y, -s], '#a57c4f'));
        p.push(box(0.12, 0.03, 2 * s, [s, y, 0], '#a57c4f'));
        p.push(box(0.12, 0.03, 2 * s, [-s, y, 0], '#a57c4f'));
    }
    p.push(box(0.02, 1.2, 0.02, [0, 0.5, s], COL.timber, [0, 0, 0.8]));
    p.push(box(0.02, 1.2, 0.02, [s, 0.5, 0], COL.timber, [0.8, 0, 0]));
    _scaffold = mergeParts(p);
    return _scaffold;
}

// ---------------------------------------------------------------------------
// Festningen, leiren og landskapet
// ---------------------------------------------------------------------------

let _fort: THREE.BufferGeometry | null = null;
/**
 * Festningen sett innenfra: vollgangen med steinlag og snø, kanoner i skyteskår over
 * brystvernet, vaktbuer på hjørnene, en stor Dannebrog, og to spisse bastioner som
 * stikker ut på sidene. Brystvernet (merlonGeo) står oppå og raser én stein om gangen.
 */
export function fortGeo() {
    if (_fort) return _fort;
    const p: Part[] = [];
    // Murfronten: skrå steinvegg fra vollen opp til festningen, med et mørkt steinlag.
    p.push(box(21, 0.5, 0.42, [0, 0.55, 0.24], COL.stone, [-0.35, 0, 0]));
    p.push(box(21, 0.07, 0.46, [0, 0.66, 0.26], COL.stoneDark, [-0.35, 0, 0])); // kordong
    // Sokkelen bak brystvernet: én sammenhengende steinbenk, så muren ikke blir tangenter.
    p.push(box(18.4, 0.1, 0.52, [0, WALL_TOP_M + 0.04, 0.2], COL.stoneDark));
    // Vollgangen: planker med snø i fugene.
    for (let i = 0; i < 12; i++) p.push(box(1.45, 0.025, 0.42, [-8.05 + i * 1.46, WALL_TOP_M + 0.01, -0.28], i % 2 ? COL.timber : COL.wood));
    // Kanoner i skyteskår over brystvernet.
    for (const x of [-6.4, -2.8, 2.8, 6.4]) {
        p.push(box(0.36, 0.16, 0.5, [x, WALL_TOP_M + 0.08, -0.2], COL.woodDark));
        p.push(cyl(0.06, 0.08, 0.7, [x, WALL_TOP_M + 0.26, 0.12], COL.iron, [Math.PI / 2 - 0.08, 0, 0], 8));
        p.push(cyl(0.1, 0.1, 0.05, [x - 0.2, WALL_TOP_M + 0.1, -0.2], COL.wood, [0, 0, Math.PI / 2], 8));
        p.push(cyl(0.1, 0.1, 0.05, [x + 0.2, WALL_TOP_M + 0.1, -0.2], COL.wood, [0, 0, Math.PI / 2], 8));
        p.push(...bombPileF(x + 0.42, -0.36, WALL_TOP_M));
    }
    // Vaktbuer (guériter) på hjørnene: små steintårn med spisst tak.
    for (const x of [-9.05, 9.05]) {
        p.push(cyl(0.2, 0.22, 0.5, [x, WALL_TOP_M + 0.25, 0.25], COL.stone, undefined, 8));
        p.push(cyl(0.21, 0.21, 0.05, [x, WALL_TOP_M + 0.33, 0.25], COL.stoneDark, undefined, 8));
        p.push(cone(0.26, 0.34, [x, WALL_TOP_M + 0.67, 0.25], '#3b3a44', 8));
        p.push(cone(0.1, 0.1, [x, WALL_TOP_M + 0.82, 0.25], COL.snow, 8));
    }
    // Dannebrog over porten (Danmark-Norge i 1718).
    p.push(cyl(0.025, 0.03, 1.8, [3.9, WALL_TOP_M + 0.9, -0.35], COL.woodDark, undefined, 6));
    p.push(box(0.78, 0.5, 0.02, [4.3, WALL_TOP_M + 1.52, -0.35], COL.red));
    p.push(box(0.78, 0.09, 0.024, [4.3, WALL_TOP_M + 1.52, -0.35], COL.white));
    p.push(box(0.09, 0.5, 0.024, [4.15, WALL_TOP_M + 1.52, -0.35], COL.white));
    // Bastionene: spisse steinhjørner som stikker ut på begge sider.
    for (const sx of [-1, 1]) {
        const x = sx * 10.6;
        p.push(box(2.5, 1.0, 2.5, [x, 0.45, 0.8], COL.stone, [0, Math.PI / 4, 0]));
        p.push(box(2.56, 0.26, 2.56, [x, 1.05, 0.8], '#8f8983', [0, Math.PI / 4, 0])); // brystvern
        p.push(box(2.1, 0.3, 2.1, [x, 1.02, 0.8], '#57534f', [0, Math.PI / 4, 0])); // innsiden
        p.push(box(1.6, 0.04, 1.2, [x - sx * 0.2, 1.18, 0.6], COL.snow, [0, Math.PI / 4, 0]));
    }
    _fort = mergeParts(p);
    return _fort;
}
const WALL_TOP_M = 0.8;
function bombPileF(x: number, z: number, y: number): Part[] {
    return [
        ball(0.06, [x - 0.06, y + 0.06, z], '#141414'),
        ball(0.06, [x + 0.06, y + 0.06, z], '#141414'),
        ball(0.06, [x, y + 0.15, z], '#141414'),
    ];
}

/**
 * Brystvernet på muren: én steinblokk per murpoeng (25), som faller én og én. Blokkene
 * står tett i tett med en skrå topp og litt snø, så de leses som én mur - ikke tangenter.
 */
let _merlon: THREE.BufferGeometry | null = null;
export function merlonGeo() {
    if (_merlon) return _merlon;
    // Murt av tilhogde steiner i skift (forskjøvne fuger), med litt snø på toppen.
    const S1 = '#7d766e';
    const S2 = '#6c665f';
    const S3 = '#8a8278';
    _merlon = mergeParts([
        box(0.7, 0.26, 0.4, [0, 0.13, 0], '#4f4b48'), // fugene (kjernen bak steinene)
        box(0.33, 0.085, 0.42, [-0.175, 0.045, 0], S1),
        box(0.33, 0.085, 0.42, [0.175, 0.045, 0], S2),
        box(0.2, 0.085, 0.42, [-0.25, 0.135, 0], S3),
        box(0.44, 0.085, 0.42, [0.1, 0.135, 0], S1),
        box(0.4, 0.085, 0.42, [-0.14, 0.225, 0], S2),
        box(0.26, 0.085, 0.42, [0.22, 0.225, 0], S3),
        box(0.72, 0.035, 0.44, [0, 0.285, 0], '#5a554f'), // dekkhelle
    ]);
    return _merlon;
}

let _tent: THREE.BufferGeometry | null = null;
export function tentGeo() {
    if (_tent) return _tent;
    _tent = mergeParts([
        {
            geometry: new THREE.CylinderGeometry(0.02, 0.6, 0.7, 4, 1),
            position: [0, 0.35, 0],
            rotation: [0, Math.PI / 4, 0],
            scale: [1, 1, 1.5],
            color: '#cbbfa8',
        },
        cyl(0.02, 0.02, 0.9, [0, 0.45, 0], COL.woodDark),
    ]);
    return _tent;
}

let _pine: THREE.BufferGeometry | null = null;
export function pineGeo() {
    if (_pine) return _pine;
    _pine = mergeParts([
        cyl(0.06, 0.08, 0.4, [0, 0.2, 0], COL.woodDark, undefined, 5),
        cone(0.6, 0.9, [0, 0.75, 0], '#1f2f2c', 6),
        cone(0.48, 0.8, [0, 1.15, 0], '#233532', 6),
        cone(0.34, 0.7, [0, 1.55, 0], '#29403b', 6),
        cone(0.2, 0.25, [0, 1.62, 0], COL.snow, 6),
    ]);
    return _pine;
}

let _gab: THREE.BufferGeometry | null = null;
/** Skanskurv på grøftekanten: flettet kurv i to farger, fylt med jord og litt snø. */
export function gabionGeo() {
    if (_gab) return _gab;
    const r = 0.14;
    _gab = mergeParts([
        cyl(r, r * 0.96, 0.1, [0, 0.01, 0], COL.wicker, undefined, 8),
        cyl(r * 1.02, r * 1.02, 0.08, [0, 0.1, 0], '#6d5230', undefined, 8),
        cyl(r, r, 0.1, [0, 0.19, 0], COL.wicker, undefined, 8),
        cyl(r * 0.92, r * 0.92, 0.03, [0, 0.25, 0], COL.earth, undefined, 8),
        cyl(r * 0.38, r * 0.5, 0.03, [0.04, 0.265, 0.02], '#c9d2dc', undefined, 5),
    ]);
    return _gab;
}

let _stake: THREE.BufferGeometry | null = null;
/** Stikkene graverne setter ut der den neste løpegraven skal gå. */
export function stakeGeo() {
    if (_stake) return _stake;
    _stake = mergeParts([
        cyl(0.012, 0.012, 0.3, [0, 0.15, 0], COL.wood, undefined, 4),
        box(0.1, 0.05, 0.01, [0.05, 0.27, 0], '#c8322b'),
    ]);
    return _stake;
}

let _debris: THREE.BufferGeometry | null = null;
export function debrisGeo() {
    if (_debris) return _debris;
    _debris = new THREE.BoxGeometry(1, 1, 1);
    return _debris;
}

// ---------------------------------------------------------------------------
// Materialer: to-trinns cel-skygge, gangen i shaderen, mørk kontur
// ---------------------------------------------------------------------------

let _grad: THREE.DataTexture | null = null;
/** To trinn lys (skygge og lys) + et lite høylys: oljemaleri, ikke plast. */
export function celRamp() {
    if (_grad) return _grad;
    const steps = new Uint8Array([88, 88, 200, 255]);
    const t = new THREE.DataTexture(steps, 4, 1, THREE.RedFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    _grad = t;
    return t;
}

const walkChunk = (d: FigureDef) => `
    float lgPh = aAnim.x;
    float lgAmp = aAnim.y;
    float lgS = sin(lgPh) * lgAmp;
    ${
        d.mode === 1
            ? `if (transformed.y < ${d.hip.toFixed(3)}) {
        float side = sign(transformed.x + 0.0001) * sign(transformed.z + 0.0001);
        transformed.z += side * lgS * (${d.hip.toFixed(3)} - transformed.y) * 1.5;
    }
    transformed.y += abs(cos(lgPh)) * 0.035 * lgAmp;`
            : `bool lgCrew = ${d.mode === 2 ? 'transformed.z < -0.3' : 'true'};
    if (lgCrew && transformed.y < ${d.hip.toFixed(3)}) {
        float side = transformed.x - ${d.mode === 2 ? '(transformed.x > 0.0 ? 0.12 : -0.12)' : '0.0'} > 0.0 ? 1.0 : -1.0;
        transformed.z += side * lgS * (${d.hip.toFixed(3)} - transformed.y) * 1.7;
    } else if (lgCrew && transformed.y < ${d.shoulder.toFixed(3)} && abs(transformed.x) > ${d.mode === 2 ? '9.0' : '0.105'}) {
        float side = transformed.x > 0.0 ? 1.0 : -1.0;
        transformed.z -= side * lgS * (${d.shoulder.toFixed(3)} - transformed.y) * 1.3;
    }
    if (lgCrew) transformed.y += abs(cos(lgPh)) * 0.018 * lgAmp;`
    }
`;

/** Toon-materiale for figurer med gangen i vertex-shaderen (aAnim = fase, utslag). */
export function figureMaterial(d: FigureDef, outline: number) {
    const mat = outline
        ? new THREE.MeshBasicMaterial({ color: '#0b0d16', side: THREE.BackSide })
        : new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: celRamp() });
    mat.onBeforeCompile = (sh) => {
        if (!outline) sh.fragmentShader = selfLitChunk(sh.fragmentShader, 0.27);
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nattribute vec2 aAnim;')
            .replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>\n${walkChunk(d)}${outline ? `transformed += normal * ${outline.toFixed(4)};` : ''}`
            );
    };
    mat.customProgramCacheKey = () => `lg-fig-${d.mode}-${d.hip}-${d.shoulder}-${outline}`;
    return mat;
}

/** Litt eget lys i fargene, så blå frakker ikke blir svarte silhuetter i natta. */
export function selfLitChunk(frag: string, k: number) {
    return frag.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance += vColor.rgb * ${k.toFixed(2)};\n#endif`
    );
}

/** Toon-materiale med to-trinns cel-skygge og litt eget lys. */
export function litToon(k: number, extra: THREE.MeshToonMaterialParameters = {}) {
    const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: celRamp(), ...extra });
    mat.onBeforeCompile = (sh) => {
        sh.fragmentShader = selfLitChunk(sh.fragmentShader, k);
    };
    mat.customProgramCacheKey = () => `lg-lit-${k}-${extra.map ? 'map' : ''}`;
    return mat;
}

/** Kontur for stillestående ting (tårn): skallet skyves ut langs normalen. */
export function outlineMaterial(t: number) {
    const mat = new THREE.MeshBasicMaterial({ color: '#0b0d16', side: THREE.BackSide });
    mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>\ntransformed += normal * ${t.toFixed(4)};`
        );
    };
    mat.customProgramCacheKey = () => `lg-outline-${t}`;
    return mat;
}

// ---------------------------------------------------------------------------
// Malte teksturer (lages én gang ved oppstart)
// ---------------------------------------------------------------------------

function canvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')!] as const;
}

function rand(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

let _snowTex: THREE.CanvasTexture | null = null;
/** Penselstrøk i snøen: lyse og kalde strøk som gjentas over marka. */
export function snowTexture() {
    if (_snowTex) return _snowTex;
    const [c, ctx] = canvas(256, 256);
    const r = rand(7);
    ctx.fillStyle = '#e4e4e4';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 520; i++) {
        const x = r() * 256;
        const y = r() * 256;
        const len = 8 + r() * 26;
        const a = -0.35 + r() * 0.3;
        const v = 200 + Math.floor(r() * 55);
        ctx.strokeStyle = `rgba(${v},${v},${Math.min(255, v + 8)},${0.25 + r() * 0.35})`;
        ctx.lineWidth = 1.5 + r() * 3.5;
        ctx.lineCap = 'round';
        for (const dx of [-256, 0, 256])
            for (const dy of [-256, 0, 256]) {
                ctx.beginPath();
                ctx.moveTo(x + dx, y + dy);
                ctx.lineTo(x + dx + Math.cos(a) * len, y + dy + Math.sin(a) * len);
                ctx.stroke();
            }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    _snowTex = t;
    return t;
}

let _splat: THREE.CanvasTexture | null = null;
/** Blodflekk / sotflekk: en uregelmessig klatt med sprut rundt (hvit, farges per flekk). */
export function splatTexture() {
    if (_splat) return _splat;
    const [c, ctx] = canvas(128, 128);
    const r = rand(3);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const rr = 26 + r() * 16;
        const x = 64 + Math.cos(a) * rr;
        const y = 64 + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.fill();
    for (let i = 0; i < 18; i++) {
        const a = r() * Math.PI * 2;
        const d = 34 + r() * 26;
        ctx.beginPath();
        ctx.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 2 + r() * 6, 0, Math.PI * 2);
        ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    _splat = t;
    return t;
}

let _puff: THREE.CanvasTexture | null = null;
/** Myk, malt røykdott til partiklene (hvit - farges per partikkel). */
export function puffTexture() {
    if (_puff) return _puff;
    const [c, ctx] = canvas(64, 64);
    const r = rand(11);
    for (let i = 0; i < 9; i++) {
        const x = 32 + (r() - 0.5) * 18;
        const y = 32 + (r() - 0.5) * 18;
        const rad = 10 + r() * 12;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,0.55)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, 64, 64);
    }
    const t = new THREE.CanvasTexture(c);
    _puff = t;
    return t;
}

let _sky: THREE.CanvasTexture | null = null;
/**
 * Bakteppet: natthimmel malt som et karolinsk slagmaleri. Mørk, varm bunn, krutrøyk som
 * store lyse skyer, åsene ved Halden og bålene i den svenske leiren.
 */
export function skyTexture() {
    if (_sky) return _sky;
    const W = 1024;
    const H = 320;
    const [c, ctx] = canvas(W, H);
    const r = rand(1718);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070b1c');
    g.addColorStop(0.45, '#142042');
    g.addColorStop(0.72, '#24315e');
    g.addColorStop(0.86, '#3a3456');
    g.addColorStop(1, '#0d1226');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Månen bak røyken.
    const mg = ctx.createRadialGradient(W * 0.22, H * 0.2, 0, W * 0.22, H * 0.2, 90);
    mg.addColorStop(0, 'rgba(220,228,255,0.9)');
    mg.addColorStop(0.12, 'rgba(200,210,240,0.55)');
    mg.addColorStop(1, 'rgba(120,140,190,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, W, H);
    // Krutrøyk: store penselstrøk i varm grå, lyst der bålene og lyskulene treffer.
    for (let i = 0; i < 260; i++) {
        const x = r() * W;
        const y = H * (0.25 + r() * 0.5);
        const w = 30 + r() * 120;
        const light = r();
        const col =
            light > 0.8 ? '230,170,110' : light > 0.4 ? '90,108,150' : '44,54,86';
        ctx.fillStyle = `rgba(${col},${0.05 + r() * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(x, y, w, w * (0.22 + r() * 0.2), (r() - 0.5) * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    // Åsene.
    ctx.fillStyle = '#080c1a';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) {
        const y = H * 0.74 - Math.sin(x * 0.006) * 26 - Math.sin(x * 0.019 + 1) * 12 - r() * 4;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.fill();
    // Bålene i leiren.
    for (let i = 0; i < 26; i++) {
        const x = W * (0.15 + r() * 0.7);
        const y = H * (0.79 + r() * 0.12);
        const gl = ctx.createRadialGradient(x, y, 0, x, y, 10 + r() * 14);
        gl.addColorStop(0, 'rgba(255,190,90,0.95)');
        gl.addColorStop(0.3, 'rgba(242,120,40,0.4)');
        gl.addColorStop(1, 'rgba(242,120,40,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(x - 30, y - 30, 60, 60);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    _sky = t;
    return t;
}

/** Lerretsvev til et CSS-lag over bildet (data-URL). */
export function weaveDataUrl() {
    const [c, ctx] = canvas(96, 96);
    const r = rand(5);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 96, 96);
    for (let y = 0; y < 96; y += 2)
        for (let x = 0; x < 96; x += 2) {
            const v = 110 + Math.floor(r() * 40) + ((x + y) % 4 === 0 ? 18 : -10);
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(x, y, 2, 1);
            ctx.fillStyle = `rgb(${v - 20},${v - 20},${v - 20})`;
            ctx.fillRect(x + 1, y + 1, 1, 1);
        }
    return c.toDataURL();
}
