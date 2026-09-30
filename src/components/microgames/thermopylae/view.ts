import type { G } from './game';

// Visningens egen hukommelse om hver perser - det spillreglene ikke trenger å vite:
// hvor langt han har gått (gangtakt), når han landet etter å ha falt, om vidjeskjoldet
// røk, om spydet ble kappet, og om blodflekken hans er lagt på sanden.

export interface ManView {
    walk: number;
    lx: number;
    lz: number;
    landT: number;
    brokenSpear: boolean;
    noShield: boolean;
    decal: boolean;
    prevState: string;
    seen: number;
}

export interface Decal {
    x: number;
    z: number;
    r: number;
    rot: number;
    t: number;
}

export interface Splinter {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    t: number;
    kind: 'vidje' | 'spyd';
}

export interface ViewState {
    men: Map<number, ManView>;
    decals: Decal[];
    splinters: Splinter[];
    lastParries: number;
    seenFx: WeakSet<object>;
    frame: number;
}

const views = new WeakMap<G, ViewState>();

export function viewOf(g: G): ViewState {
    let v = views.get(g);
    if (!v) {
        v = { men: new Map(), decals: [], splinters: [], lastParries: 0, seenFx: new WeakSet(), frame: 0 };
        views.set(g, v);
    }
    return v;
}

export function manOf(v: ViewState, id: number, x: number, z: number): ManView {
    let m = v.men.get(id);
    if (!m) {
        m = { walk: Math.random() * 6, lx: x, lz: z, landT: -1, brokenSpear: false, noShield: false, decal: false, prevState: '', seen: 0 };
        v.men.set(id, m);
    }
    return m;
}

export function addDecal(v: ViewState, x: number, z: number, r: number) {
    v.decals.push({ x, z, r, rot: Math.random() * 6.28, t: 0 });
    if (v.decals.length > 60) v.decals.shift();
}

// Pilene fra siste pilregn: de som står i sanden, og hvor mange som sitter i skjoldet ditt.
export interface Stuck {
    x: number;
    z: number;
    rx: number;
    rz: number;
    t: number;
}
export const stuckOf = new WeakMap<G, { list: Stuck[]; prevWarn: number; shield: number }>();
export function shieldArrows(g: G) {
    const s = stuckOf.get(g);
    return s ? s.shield : 0;
}
