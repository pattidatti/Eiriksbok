import * as THREE from 'three';
import type { G, Fx } from './game';
import { C } from './models';

// Røyk, ild, støv og smell som trykte former: kantete skyer i flate farger og
// eksplosjoner som stjerner (gul inni rød), slik plakatene tegnet dem. Dette er lageret
// av partikler; effects.tsx tegner dem som to instanserte mesher (ett draw call hver).

export type PuffKind = 'røyk' | 'sot' | 'ild' | 'glo' | 'støv' | 'vann';

interface Puff {
    on: boolean;
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
    col: THREE.Color;
}

interface Star {
    on: boolean;
    x: number;
    y: number;
    z: number;
    r: number;
    t: number;
    life: number;
    col: THREE.Color;
    spin: number;
}

const COL: Record<PuffKind | 'gul' | 'rød', THREE.Color> = {
    røyk: new THREE.Color(C.røyk),
    sot: new THREE.Color('#3b3a36'),
    ild: new THREE.Color(C.fare),
    glo: new THREE.Color(C.radio),
    støv: new THREE.Color('#c9b88a'),
    vann: new THREE.Color('#dfe3e0'),
    gul: new THREE.Color(C.radio),
    rød: new THREE.Color(C.fare),
};

export const MAX_PUFF = 320;
export const MAX_STAR = 48;

/** Effektlaget. Lages én gang i spillkomponenten og deles med figurene. */
export function createFx() {
    const puffs: Puff[] = Array.from({ length: MAX_PUFF }, () => ({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r0: 0, r1: 0, t: 0, life: 1, col: COL.røyk }));
    const stars: Star[] = Array.from({ length: MAX_STAR }, () => ({ on: false, x: 0, y: 0, z: 0, r: 0, t: 0, life: 1, col: COL.gul, spin: 0 }));
    let pi = 0;
    let si = 0;
    /** Kvalitetsnivået skalerer mengden (Chromebook: færre). */
    let scale = 1;
    const puff = (kind: PuffKind, x: number, y: number, z: number, o: { r?: number; grow?: number; life?: number; up?: number; spread?: number } = {}) => {
        const p = puffs[pi];
        pi = (pi + 1) % MAX_PUFF;
        const s = o.spread ?? 0.4;
        p.on = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = (Math.random() - 0.5) * s;
        p.vz = (Math.random() - 0.5) * s;
        p.vy = o.up ?? 0.5;
        p.r0 = o.r ?? 0.2;
        p.r1 = p.r0 * (o.grow ?? 2.2);
        p.t = 0;
        p.life = (o.life ?? 1.4) * (0.8 + Math.random() * 0.4);
        p.col = COL[kind];
    };
    const star = (x: number, y: number, z: number, r: number, life: number, red = false) => {
        const s = stars[si];
        si = (si + 1) % MAX_STAR;
        Object.assign(s, { on: true, x, y, z, r, t: 0, life, col: red ? COL.rød : COL.gul, spin: Math.random() * Math.PI });
    };
    const n = (k: number) => Math.max(1, Math.round(k * scale));
    return {
        puffs,
        stars,
        puff,
        star,
        setScale: (s: number) => (scale = s),
        /** Eldes og flyttes ett tidssteg. */
        step(dt: number) {
            for (const p of puffs) {
                if (!p.on) continue;
                p.t += dt;
                if (p.t >= p.life) p.on = false;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.z += p.vz * dt;
                p.vx *= 1 - dt * 1.5;
                p.vz *= 1 - dt * 1.5;
            }
            for (const s of stars) {
                if (!s.on) continue;
                s.t += dt;
                if (s.t >= s.life) s.on = false;
            }
        },
        /** Et smell: rød stjerne, gul stjerne inni, ild og røyk som stiger. */
        boom(x: number, y: number, z: number, big = 1) {
            star(x, y + 0.25, z, 0.75 * big, 0.32, true);
            star(x, y + 0.3, z, 0.45 * big, 0.22);
            for (let i = 0; i < n(4 * big); i++) puff('ild', x, y + 0.2, z, { r: 0.16 * big, grow: 1.6, life: 0.45, up: 0.9, spread: 1.4 });
            for (let i = 0; i < n(5 * big); i++) puff(i % 2 ? 'sot' : 'røyk', x, y + 0.3, z, { r: 0.2 * big, grow: 2.6, life: 1.8, up: 0.7, spread: 0.9 });
        },
        /** Granat i bakken: jord og støv kastes opp. */
        blast(x: number, z: number, red = false) {
            star(x, 0.2, z, 0.5, 0.2, red);
            for (let i = 0; i < n(5); i++) puff('støv', x, 0.1, z, { r: 0.18, grow: 2.4, life: 1, up: 1.3, spread: 1.6 });
            for (let i = 0; i < n(2); i++) puff('sot', x, 0.2, z, { r: 0.16, grow: 2, life: 0.8, up: 0.8 });
        },
        /** Munningsflamme. */
        flash(x: number, y: number, z: number, r = 0.18) {
            star(x, y, z, r, 0.09);
            puff('røyk', x, y, z, { r: r * 0.7, grow: 2.2, life: 0.7, up: 0.3, spread: 0.3 });
        },
        /** Vrak som brenner: kalles jevnlig av figuren. */
        burn(x: number, z: number, hot: number) {
            if (hot > 0.5 && Math.random() < 0.5) puff('ild', x, 0.35, z, { r: 0.12, grow: 1.4, life: 0.4, up: 0.8, spread: 0.2 });
            puff(hot > 0.3 ? 'sot' : 'røyk', x, 0.45, z, { r: 0.16, grow: 3, life: 2.2, up: 0.55, spread: 0.2 });
        },
    };
}

export type FxPool = ReturnType<typeof createFx>;

/** Gjør spillets egne fx (smell, granater, kutt, skudd) om til trykte effekter. */
export function consume(g: G, fx: FxPool, seen: WeakSet<Fx>) {
    for (const f of g.fx) {
        if (seen.has(f)) continue;
        seen.add(f);
        if (f.kind === 'smell') fx.boom(f.x, f.alt, f.z, f.alt > 0.5 ? 0.8 : f.life > 0.85 ? 1.1 : 0.9);
        else if (f.kind === 'granat' || f.kind === 'sperre') fx.blast(f.x, f.z, f.fiende);
        else if (f.kind === 'kutt') fx.star(f.x, 0.9, f.z, 0.55, 0.5, true);
        else if (f.kind === 'skudd') {
            // Flammen ved løpet, litt ut mot målet.
            const dx = f.x2 - f.x;
            const dz = f.z2 - f.z;
            const d = Math.hypot(dx, dz) || 1;
            fx.flash(f.x + (dx / d) * 0.45, 0.4, f.z + (dz / d) * 0.45, f.fiende ? 0.14 : 0.18);
            if (f.alt < 0.3 && Math.random() < 0.5) fx.puff('støv', f.x2, 0.1, f.z2, { r: 0.08, grow: 2, life: 0.5, up: 0.4 });
        }
    }
}

