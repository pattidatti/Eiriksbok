import * as THREE from 'three';
import type { G, Fx } from './game';

// Røyk, ild, støv, jord og smell som myke partikler (kunstbrief v2): røyken er
// halvgjennomsiktige skyer som vokser og blekner, ild og munningsflammer gløder
// (additive, bloom på middels/høy), jord kastes opp og faller ned igjen, og der noe
// eksploderte blir det liggende en svart brannflekk. Dette er lageret; effects.tsx
// tegner det med tre instanserte mesher uansett hvor mye som skjer.

export type PuffKind = 'røyk' | 'sot' | 'ild' | 'glo' | 'støv' | 'vann' | 'jord' | 'blits';

interface Puff {
    on: boolean;
    glow: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    r0: number;
    r1: number;
    t: number;
    life: number;
    /** Hvor tett skyen er på det tetteste (0-1). */
    a: number;
    /** Tyngdekraft (jordklumper faller ned). */
    fall: number;
    spin: number;
    col: THREE.Color;
}

export interface Scorch {
    on: boolean;
    x: number;
    z: number;
    r: number;
    rot: number;
}

const COL: Record<PuffKind, THREE.Color> = {
    røyk: new THREE.Color('#9a968c'),
    sot: new THREE.Color('#2e2b27'),
    ild: new THREE.Color('#ff6a12').multiplyScalar(2.2),
    glo: new THREE.Color('#ffc24a').multiplyScalar(2.6),
    blits: new THREE.Color('#fff0c0').multiplyScalar(3),
    støv: new THREE.Color('#b5a17c'),
    vann: new THREE.Color('#e4eaec'),
    jord: new THREE.Color('#4d3d2a'),
};
const GLOW: Record<PuffKind, boolean> = { røyk: false, sot: false, ild: true, glo: true, blits: true, støv: false, vann: false, jord: false };
const ALPHA: Record<PuffKind, number> = { røyk: 0.55, sot: 0.7, ild: 0.9, glo: 1, blits: 1, støv: 0.45, vann: 0.6, jord: 0.95 };

export const MAX_PUFF = 420;
export const MAX_SCORCH = 48;

/** Effektlaget. Lages én gang i spillkomponenten og deles med figurene. */
export function createFx() {
    const puffs: Puff[] = Array.from({ length: MAX_PUFF }, () => ({
        on: false, glow: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r0: 0, r1: 0, t: 0, life: 1, a: 1, fall: 0, spin: 0, col: COL.røyk,
    }));
    const scorches: Scorch[] = Array.from({ length: MAX_SCORCH }, () => ({ on: false, x: 0, z: 0, r: 0, rot: 0 }));
    let pi = 0;
    let si = 0;
    /** Kvalitetsnivået skalerer mengden (Chromebook: færre). */
    let scale = 1;
    /** Støvfargen følger bakken i slaget. */
    const dust = COL.støv.clone();
    const puff = (kind: PuffKind, x: number, y: number, z: number, o: { r?: number; grow?: number; life?: number; up?: number; spread?: number; fall?: number } = {}) => {
        const p = puffs[pi];
        pi = (pi + 1) % MAX_PUFF;
        const s = o.spread ?? 0.4;
        p.on = true;
        p.glow = GLOW[kind];
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = (Math.random() - 0.5) * s;
        p.vz = (Math.random() - 0.5) * s;
        p.vy = (o.up ?? 0.5) * (0.7 + Math.random() * 0.6);
        p.r0 = o.r ?? 0.2;
        p.r1 = p.r0 * (o.grow ?? 2.2);
        p.t = 0;
        p.life = (o.life ?? 1.4) * (0.8 + Math.random() * 0.4);
        p.a = ALPHA[kind];
        p.fall = o.fall ?? 0;
        p.spin = Math.random() * Math.PI * 2;
        p.col = kind === 'støv' ? dust : COL[kind];
    };
    const n = (k: number) => Math.max(1, Math.round(k * scale));
    const scorch = (x: number, z: number, r: number) => {
        const s = scorches[si];
        si = (si + 1) % MAX_SCORCH;
        Object.assign(s, { on: true, x, z, r: r * (0.8 + Math.random() * 0.4), rot: Math.random() * Math.PI * 2 });
    };
    /** Et lysglimt (tidligere «stjerne»): kort, stort og glødende. */
    const star = (x: number, y: number, z: number, r: number, life: number, red = false) =>
        puff(red ? 'ild' : 'blits', x, y, z, { r: r * 0.9, grow: 1.5, life, up: 0, spread: 0 });
    return {
        puffs,
        scorches,
        puff,
        star,
        scorch,
        setScale: (s: number) => (scale = s),
        setDust: (hex: string) => dust.set(hex),
        clearScorch: () => scorches.forEach((s) => (s.on = false)),
        /** Eldes og flyttes ett tidssteg. */
        step(dt: number) {
            for (const p of puffs) {
                if (!p.on) continue;
                p.t += dt;
                if (p.t >= p.life) p.on = false;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.z += p.vz * dt;
                if (p.fall) {
                    p.vy -= p.fall * dt;
                    if (p.y < 0.02) p.on = false;
                } else {
                    p.vy *= 1 - dt * 0.6;
                }
                p.vx *= 1 - dt * 1.5;
                p.vz *= 1 - dt * 1.5;
            }
        },
        /** Et smell: ildkule, glør, jord og tung røyk som stiger og driver. */
        boom(x: number, y: number, z: number, big = 1) {
            puff('blits', x, y + 0.3, z, { r: 0.55 * big, grow: 1.4, life: 0.16, up: 0, spread: 0 });
            for (let i = 0; i < n(5 * big); i++) puff('ild', x, y + 0.25, z, { r: 0.22 * big, grow: 1.8, life: 0.5, up: 1.1, spread: 1.6 });
            for (let i = 0; i < n(3); i++) puff('glo', x, y + 0.3, z, { r: 0.05, grow: 1, life: 0.9, up: 2.2, spread: 2.6, fall: 3 });
            for (let i = 0; i < n(6 * big); i++) puff(i % 3 ? 'sot' : 'røyk', x, y + 0.35, z, { r: 0.24 * big, grow: 3.2, life: 2.6, up: 0.8, spread: 0.9 });
            if (y < 0.3) {
                for (let i = 0; i < n(5); i++) puff('jord', x, 0.2, z, { r: 0.05, grow: 1, life: 1.2, up: 2.6, spread: 2.4, fall: 7 });
                scorch(x, z, 0.55 * big);
            }
        },
        /** Granat i bakken: jord og støv kastes opp, en svidd flekk blir igjen. */
        blast(x: number, z: number, red = false) {
            puff(red ? 'ild' : 'blits', x, 0.25, z, { r: 0.4, grow: 1.3, life: 0.14, up: 0, spread: 0 });
            for (let i = 0; i < n(6); i++) puff('jord', x, 0.15, z, { r: 0.045, grow: 1, life: 1.1, up: 3, spread: 1.8, fall: 8 });
            for (let i = 0; i < n(5); i++) puff('støv', x, 0.15, z, { r: 0.24, grow: 2.8, life: 1.6, up: 0.9, spread: 1.4 });
            for (let i = 0; i < n(2); i++) puff('sot', x, 0.25, z, { r: 0.2, grow: 2.4, life: 1.1, up: 0.8 });
            scorch(x, z, 0.35);
        },
        /** Munningsflamme og en liten røykdott. */
        flash(x: number, y: number, z: number, r = 0.18) {
            puff('blits', x, y, z, { r: r * 1.1, grow: 1.2, life: 0.07, up: 0, spread: 0 });
            puff('røyk', x, y, z, { r: r * 0.8, grow: 2.6, life: 0.9, up: 0.3, spread: 0.3 });
        },
        /** Vrak som brenner: kalles jevnlig av figuren. Ild så lenge det er varmt, så røyksøyle. */
        burn(x: number, z: number, hot: number) {
            if (hot > 0.35 && Math.random() < 0.6) puff('ild', x + (Math.random() - 0.5) * 0.2, 0.35, z, { r: 0.13, grow: 1.4, life: 0.5, up: 0.9, spread: 0.2 });
            puff(hot > 0.2 ? 'sot' : 'røyk', x, 0.5, z, { r: 0.18, grow: 3.6, life: 3, up: 0.7, spread: 0.25 });
        },
    };
}

export type FxPool = ReturnType<typeof createFx>;

/** Gjør spillets egne fx (smell, granater, kutt, skudd) om til effekter. */
export function consume(g: G, fx: FxPool, seen: WeakSet<Fx>) {
    for (const f of g.fx) {
        if (seen.has(f)) continue;
        seen.add(f);
        if (f.kind === 'smell') fx.boom(f.x, f.alt, f.z, f.alt > 0.5 ? 0.8 : f.life > 0.85 ? 1.1 : 0.9);
        else if (f.kind === 'granat' || f.kind === 'sperre') fx.blast(f.x, f.z, f.fiende);
        else if (f.kind === 'kutt') {
            // Linja ryker: gnister i lufta.
            fx.star(f.x, 0.9, f.z, 0.4, 0.25, true);
            for (let i = 0; i < 4; i++) fx.puff('glo', f.x, 0.9, f.z, { r: 0.04, grow: 1, life: 0.7, up: 1.5, spread: 2.2, fall: 4 });
        } else if (f.kind === 'skudd') {
            // Flammen ved løpet, litt ut mot målet.
            const dx = f.x2 - f.x;
            const dz = f.z2 - f.z;
            const d = Math.hypot(dx, dz) || 1;
            fx.flash(f.x + (dx / d) * 0.45, 0.4, f.z + (dz / d) * 0.45, f.fiende ? 0.14 : 0.18);
            if (f.alt < 0.3 && Math.random() < 0.5) fx.puff('støv', f.x2, 0.1, f.z2, { r: 0.1, grow: 2.2, life: 0.6, up: 0.4 });
        }
    }
}
