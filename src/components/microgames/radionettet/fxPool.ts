import * as THREE from 'three';
import type { G, Fx } from './game';
import { flare } from './flare';
import { AIR_ALT } from './combat';

// Røyk, ild, støv, jord og smell som myke partikler (kunstbrief v2): røyken er
// halvgjennomsiktige skyer som vokser og blekner, ild og munningsflammer gløder
// (additive, bloom på middels/høy), jord kastes opp og faller ned igjen, og der noe
// eksploderte blir det liggende en svart brannflekk. Dette er lageret; effects.tsx
// tegner det med tre instanserte mesher uansett hvor mye som skjer.

export type PuffKind = 'røyk' | 'sot' | 'ild' | 'glo' | 'støv' | 'vann' | 'jord' | 'blits' | 'spor' | 'espor';

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
    /** Luftmotstand (1 = vanlig; 0 = granat som flyr rett). */
    drag: number;
    /** Bakkehøyden der den startet (åsene på brettet). */
    g: number;
    /** Sporlys og granater: strekkes ut langs farten (sekunder med bevegelse som vises). */
    streak: number;
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
    // Sporlys: våre gule, fiendens rødoransje.
    spor: new THREE.Color('#ffd36a').multiplyScalar(3),
    espor: new THREE.Color('#ff6a3a').multiplyScalar(3),
};
const GLOW: Record<PuffKind, boolean> = { røyk: false, sot: false, ild: true, glo: true, blits: true, støv: false, vann: false, jord: false, spor: true, espor: true };
const ALPHA: Record<PuffKind, number> = { røyk: 0.55, sot: 0.7, ild: 0.9, glo: 1, blits: 1, støv: 0.45, vann: 0.6, jord: 0.95, spor: 1, espor: 1 };

export const MAX_PUFF = 560;
export const MAX_SCORCH = 48;

/** Effektlaget. Lages én gang i spillkomponenten og deles med figurene. */
export function createFx() {
    const puffs: Puff[] = Array.from({ length: MAX_PUFF }, () => ({
        on: false, glow: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r0: 0, r1: 0, t: 0, life: 1, a: 1, fall: 0, spin: 0, drag: 1, g: 0, streak: 0, col: COL.røyk,
    }));
    const scorches: Scorch[] = Array.from({ length: MAX_SCORCH }, () => ({ on: false, x: 0, z: 0, r: 0, rot: 0 }));
    let pi = 0;
    let si = 0;
    /** Kvalitetsnivået skalerer mengden (Chromebook: færre). */
    let scale = 1;
    /** Støvfargen følger bakken i slaget. */
    const dust = COL.støv.clone();
    /** Bakkehøyden i slaget: alle y-er under er over bakken, ikke over null. */
    let ground = (_x: number, _z: number) => 0;
    const puff = (kind: PuffKind, x: number, y: number, z: number, o: { r?: number; grow?: number; life?: number; up?: number; spread?: number; fall?: number } = {}) => {
        const p = puffs[pi];
        pi = (pi + 1) % MAX_PUFF;
        const s = o.spread ?? 0.4;
        p.on = true;
        p.glow = GLOW[kind];
        p.g = ground(x, z);
        p.x = x;
        p.y = y + p.g;
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
        p.drag = 1;
        p.streak = 0;
        p.col = kind === 'støv' ? dust : COL[kind];
        return p;
    };
    /** Noe som skal skje litt senere (granaten treffer når den kommer fram). */
    const later: { t: number; fn: () => void }[] = [];
    /** Vinden driver røyken sakte over slagmarken. */
    const WIND_X = 0.22;
    const WIND_Z = -0.08;
    const n = (k: number) => Math.max(1, Math.round(k * scale));
    const scorch = (x: number, z: number, r: number) => {
        const s = scorches[si];
        si = (si + 1) % MAX_SCORCH;
        Object.assign(s, { on: true, x, z, r: r * (0.8 + Math.random() * 0.4), rot: Math.random() * Math.PI * 2 });
    };
    /** Et lysglimt (tidligere «stjerne»): kort, stort og glødende. */
    /** Lyset fra glimtet (flare.ts): y er over bakken. */
    const light = (x: number, y: number, z: number, power: number, life: number, dist: number) => flare(x, y + ground(x, z), z, power * Math.min(1, scale + 0.3), life, dist);
    /** Støvring som blåses ut langs bakken fra et smell (trykkbølgen). */
    const ring = (x: number, z: number, k: number, speed: number, r: number) => {
        for (let i = 0; i < k; i++) {
            const a = (i / k) * Math.PI * 2 + Math.random() * 0.3;
            const p = puff('støv', x, 0.08, z, { r, grow: 2.8, life: 0.9 + Math.random() * 0.3, up: 0.15, spread: 0 });
            p.vx = Math.cos(a) * speed;
            p.vz = Math.sin(a) * speed;
            p.drag = 1.6;
        }
    };
    /** Noe som flyr rett fram og strekkes ut langs farten (sporlys, granat). */
    const bolt = (kind: PuffKind, x: number, y: number, z: number, x2: number, y2: number, z2: number, life: number, r: number, streak: number) => {
        const p = puff(kind, x, y, z, { r, grow: 1, life, up: 0, spread: 0 });
        p.vx = (x2 - x) / life;
        p.vy = (y2 + ground(x2, z2) - p.y) / life;
        p.vz = (z2 - z) / life;
        p.drag = 0;
        p.life = life;
        p.streak = streak;
        return p;
    };
    const star = (x: number, y: number, z: number, r: number, life: number, red = false) =>
        puff(red ? 'ild' : 'blits', x, y, z, { r: r * 0.9, grow: 1.5, life, up: 0, spread: 0 });
    return {
        puffs,
        scorches,
        puff,
        star,
        scorch,
        setScale: (s: number) => (scale = s),
        setGround: (fn: (x: number, z: number) => number) => (ground = fn),
        groundAt: (x: number, z: number) => ground(x, z),
        setDust: (hex: string) => dust.set(hex),
        clearScorch: () => scorches.forEach((s) => (s.on = false)),
        /** Eldes og flyttes ett tidssteg. */
        step(dt: number) {
            for (let i = later.length - 1; i >= 0; i--) {
                later[i].t -= dt;
                if (later[i].t <= 0) {
                    const fn = later[i].fn;
                    later.splice(i, 1);
                    fn();
                }
            }
            for (const p of puffs) {
                if (!p.on) continue;
                if (!p.glow && !p.fall) {
                    p.x += WIND_X * dt;
                    p.z += WIND_Z * dt;
                }
                p.t += dt;
                if (p.t >= p.life) p.on = false;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.z += p.vz * dt;
                if (p.fall) {
                    p.vy -= p.fall * dt;
                    if (p.y < p.g + 0.02) p.on = false;
                } else {
                    p.vy *= 1 - dt * 0.6 * p.drag;
                }
                p.vx *= 1 - dt * 1.5 * p.drag;
                p.vz *= 1 - dt * 1.5 * p.drag;
            }
        },
        /** Et smell: ildkule, glør, jord og tung røyk som stiger og driver. */
        boom(x: number, y: number, z: number, big = 1) {
            puff('blits', x, y + 0.3, z, { r: 0.85 * big, grow: 1.5, life: 0.18, up: 0, spread: 0 });
            light(x, y + 0.6, z, 1.6 * big, 0.55, 6 * big);
            // Ildkula ruller oppover og blir til en sopp av røyk.
            for (let i = 0; i < n(8 * big); i++) puff('ild', x, y + 0.25, z, { r: 0.26 * big, grow: 2, life: 0.55 + Math.random() * 0.3, up: 1.4, spread: 1.8 });
            for (let i = 0; i < n(3); i++) puff('ild', x, y + 0.3, z, { r: 0.18 * big, grow: 2.4, life: 0.9, up: 2.6, spread: 0.4 });
            for (let i = 0; i < n(10); i++) puff('glo', x, y + 0.3, z, { r: 0.045, grow: 1, life: 1.1, up: 3.2, spread: 3.6, fall: 4 });
            for (let i = 0; i < n(6 * big); i++) puff(i % 3 ? 'sot' : 'røyk', x, y + 0.35, z, { r: 0.24 * big, grow: 3.2, life: 2.6, up: 0.8, spread: 0.9 });
            if (y < 0.3) {
                ring(x, z, n(12), 3.2 * big, 0.14);
                for (let i = 0; i < n(5); i++) puff('jord', x, 0.2, z, { r: 0.05, grow: 1, life: 1.2, up: 2.6, spread: 2.4, fall: 7 });
                // Vrakdeler: svarte biter som kastes høyt og faller ned igjen med røykhale.
                if (big >= 0.9)
                    for (let i = 0; i < n(4); i++) {
                        const p = puff('sot', x, 0.4, z, { r: 0.07, grow: 1.1, life: 1.6, up: 4.2, spread: 3.4, fall: 7.5 });
                        p.a = 1;
                        for (let k = 1; k < 4 && later.length < 80; k++)
                            later.push({ t: k * 0.12, fn: () => void (p.on && puff('røyk', p.x, p.y - p.g, p.z, { r: 0.05, grow: 2.4, life: 0.8, up: 0.1, spread: 0.05 })) });
                    }
                scorch(x, z, 0.55 * big);
                // Ammunisjonen inni går av: to-tre mindre smell etterpå, med gnistfontene.
                if (big >= 1)
                    for (let k = 0; k < 2 + (Math.random() < 0.5 ? 1 : 0); k++) {
                        const ox = (Math.random() - 0.5) * 0.5;
                        const oz = (Math.random() - 0.5) * 0.5;
                        later.push({
                            t: 0.35 + k * 0.32 + Math.random() * 0.15,
                            fn: () => {
                                puff('blits', x + ox, 0.4, z + oz, { r: 0.45, grow: 1.3, life: 0.1, up: 0, spread: 0 });
                                light(x + ox, 0.6, z + oz, 0.9, 0.3, 4);
                                for (let i = 0; i < n(3); i++) puff('ild', x + ox, 0.35, z + oz, { r: 0.16, grow: 1.8, life: 0.45, up: 1.2, spread: 1 });
                                for (let i = 0; i < n(6); i++) puff('glo', x + ox, 0.4, z + oz, { r: 0.035, grow: 1, life: 0.9, up: 3.6, spread: 2.2, fall: 5 });
                            },
                        });
                    }
            }
        },
        /** Granat i bakken: jord og støv kastes opp, en svidd flekk blir igjen. */
        blast(x: number, z: number, red = false) {
            puff(red ? 'ild' : 'blits', x, 0.25, z, { r: 0.55, grow: 1.4, life: 0.16, up: 0, spread: 0 });
            puff('ild', x, 0.25, z, { r: 0.22, grow: 1.8, life: 0.35, up: 0.8, spread: 0.4 });
            light(x, 0.5, z, 1, 0.35, 4.5);
            ring(x, z, n(8), 2.4, 0.1);
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
        after(t: number, fn: () => void) {
            if (later.length < 80) later.push({ t, fn });
        },
        /** Kanonskudd fra vogn eller panservern: stor flamme, trykkbølge av røyk forover og
         *  støv som blåses ut fra bakken rundt løpet. */
        muzzle(x: number, y: number, z: number, dx: number, dz: number, big = 1) {
            puff('blits', x, y, z, { r: 0.4 * big, grow: 1.3, life: 0.09, up: 0, spread: 0 });
            light(x + dx * 0.3, y + 0.2, z + dz * 0.3, 0.7 * big, 0.14, 3.5);
            puff('ild', x + dx * 0.15, y, z + dz * 0.15, { r: 0.2 * big, grow: 1.6, life: 0.14, up: 0, spread: 0 });
            for (let i = 0; i < n(4 * big); i++) {
                const p = puff('røyk', x, y, z, { r: 0.12 * big, grow: 3, life: 1.1 + i * 0.15, up: 0.15, spread: 0.2 });
                const v = 1.4 + i * 0.5;
                p.vx += dx * v;
                p.vz += dz * v;
            }
            for (let i = 0; i < n(5 * big); i++) {
                const a = (i / 5) * Math.PI * 2;
                const p = puff('støv', x - dx * 0.3, 0.06, z - dz * 0.3, { r: 0.1, grow: 2.6, life: 0.8, up: 0.1, spread: 0 });
                p.vx = Math.cos(a) * 1.6;
                p.vz = Math.sin(a) * 1.6;
            }
        },
        /** Rakett fra flyet: glødende hale og en stripe hvit røyk etter seg. */
        rocket(x: number, y: number, z: number, x2: number, z2: number, life: number) {
            bolt('spor', x, y, z, x2, 0.1, z2, life, 0.07, 0.12);
            puff('blits', x, y, z, { r: 0.22, grow: 1.2, life: 0.08, up: 0, spread: 0 });
            for (let k = 0; k < 6 && later.length < 80; k++) {
                const f = k / 6;
                later.push({ t: life * f, fn: () => void puff('røyk', x + (x2 - x) * f, y + (0.1 - y) * f, z + (z2 - z) * f, { r: 0.08, grow: 3, life: 1.3, up: 0.1, spread: 0.1 }) });
            }
        },
        /** Signalraketten fra kommandovogna: en rød stjerne som stiger og henger i lufta. */
        signal(x: number, z: number) {
            const p = bolt('ild', x, 0.6, z, x + 0.4, 5.2, z - 0.3, 0.7, 0.1, 0.06);
            p.g = 0;
            for (let k = 1; k < 8 && later.length < 80; k++) later.push({ t: 0.7 + k * 0.12, fn: () => void puff('ild', x + 0.4, 5.1 - k * 0.12, z - 0.3, { r: 0.16, grow: 1.4, life: 0.35, up: 0, spread: 0.05 }) });
            for (let k = 0; k < 5; k++) puff('røyk', x, 0.7 + k * 0.9, z, { r: 0.07, grow: 2.2, life: 1.8, up: 0.2, spread: 0.05 });
            flare(x, 5, z, 1.2, 1.6, 9, RED);
        },
        /** Granaten: en glødende prikk som farer rett fram til målet. */
        shell(x: number, y: number, z: number, x2: number, y2: number, z2: number, life: number) {
            bolt('glo', x, y, z, x2, y2, z2, life, 0.08, 0.05);
        },
        /** Sporlys fra gevær og maskingevær: en glødende strek som farer til målet. */
        tracer(x: number, y: number, z: number, x2: number, y2: number, z2: number, enemy: boolean) {
            const d = Math.hypot(x2 - x, z2 - z);
            const life = Math.max(0.08, d / 16);
            bolt(enemy ? 'espor' : 'spor', x, y, z, x2, y2, z2, life, 0.045, 0.05);
        },
        /** Treff på panser: gnister som spruter og en svart dott. */
        sparks(x: number, y: number, z: number) {
            puff('blits', x, y, z, { r: 0.32, grow: 1.2, life: 0.08, up: 0, spread: 0 });
            light(x, y + 0.2, z, 0.6, 0.12, 3);
            for (let i = 0; i < n(12); i++) puff('glo', x, y, z, { r: 0.035, grow: 1, life: 0.5, up: 2.2, spread: 4.2, fall: 6 });
            puff('sot', x, y, z, { r: 0.12, grow: 2.2, life: 0.9, up: 0.4, spread: 0.2 });
        },
        /** Granat i jorda (bom eller mykt mål): en liten sprut av jord og støv. */
        thud(x: number, z: number) {
            puff('blits', x, 0.2, z, { r: 0.18, grow: 1.2, life: 0.06, up: 0, spread: 0 });
            for (let i = 0; i < n(4); i++) puff('jord', x, 0.12, z, { r: 0.035, grow: 1, life: 0.8, up: 2, spread: 1.4, fall: 8 });
            puff('støv', x, 0.12, z, { r: 0.16, grow: 2.6, life: 1, up: 0.4, spread: 0.4 });
        },
        /** Luftvern: en svart sky som springer ut i lufta. */
        flak(x: number, y: number, z: number) {
            puff('blits', x, y, z, { r: 0.16, grow: 1.2, life: 0.06, up: 0, spread: 0 });
            puff('sot', x, y, z, { r: 0.16, grow: 2.4, life: 1.4, up: 0.05, spread: 0.2 });
        },
        /** Vrak som brenner: kalles jevnlig av figuren. Ild så lenge det er varmt, så røyksøyle. */
        burn(x: number, z: number, hot: number) {
            if (hot > 0.35 && Math.random() < 0.6) puff('ild', x + (Math.random() - 0.5) * 0.2, 0.35, z, { r: 0.13, grow: 1.4, life: 0.5, up: 0.9, spread: 0.2 });
            puff(hot > 0.2 ? 'sot' : 'røyk', x, 0.5, z, { r: 0.18, grow: 3.6, life: 3, up: 0.7, spread: 0.25 });
        },
    };
}

export type FxPool = ReturnType<typeof createFx>;

const RED = new THREE.Color('#ff4a2a');
const HEAVY = new Set(['vogn', 'pv', 'evogn', 'epak']);
const RIFLE = new Set(['inf', 'fsk', 'einf']);
/** Hvor langt fram løpet stikker, og hvor høyt det sitter (figurskala 1,4). */
const BARREL: Record<string, [number, number]> = { vogn: [0.6, 0.42], evogn: [0.6, 0.42], pv: [0.55, 0.28], epak: [0.55, 0.28] };

/** Gjør spillets egne fx (smell, granater, kutt, skudd) om til effekter og lyd. */
export function consume(g: G, fx: FxPool, seen: WeakSet<Fx>, sound?: (name: string) => void) {
    for (const f of g.fx) {
        if (seen.has(f)) continue;
        seen.add(f);
        if (f.kind === 'smell') {
            const big = f.alt > 0.5 ? 0.8 : f.life > 0.85 ? 1.1 : 0.9;
            fx.boom(f.x, f.alt, f.z, big);
            if (big >= 1) g.shake = Math.max(g.shake, 0.35);
        }
        else if (f.kind === 'granat') fx.blast(f.x, f.z, f.fiende);
        else if (f.kind === 'sperre' || f.kind === 'rakett') {
            // Sperreild og raketter: tunge nedslag med ildkule, jord og krater.
            fx.blast(f.x, f.z);
            fx.boom(f.x, 0, f.z, f.kind === 'sperre' ? 0.75 : 0.6);
            g.shake = Math.max(g.shake, f.kind === 'sperre' ? 0.55 : 0.4);
            sound?.(f.kind === 'sperre' ? 'salvenedslag' : 'nedslag');
        } else if (f.kind === 'snik') {
            // Snikskuddet: ett skarpt glimt og en lang, lys strek rett i målet.
            const y2 = Math.max(0.35, f.alt);
            fx.flash(f.x, 0.5, f.z, 0.2);
            fx.tracer(f.x, 0.5, f.z, f.x2, y2, f.z2, false);
            fx.tracer(f.x, 0.52, f.z, f.x2, y2 + 0.02, f.z2, false);
            fx.after(0.06, () => fx.sparks(f.x2, y2, f.z2));
            sound?.('snik');
        }
        else if (f.kind === 'kutt') {
            // Linja ryker: gnister i lufta.
            fx.star(f.x, 0.9, f.z, 0.4, 0.25, true);
            for (let i = 0; i < 4; i++) fx.puff('glo', f.x, 0.9, f.z, { r: 0.04, grow: 1, life: 0.7, up: 1.5, spread: 2.2, fall: 4 });
        } else if (f.kind === 'skudd') {
            const dx = f.x2 - f.x;
            const dz = f.z2 - f.z;
            const d = Math.hypot(dx, dz) || 1;
            const ux = dx / d;
            const uz = dz / d;
            const by = f.by ?? '';
            if (HEAVY.has(by)) {
                // Kanonskuddet: flamme ved munningen, granaten farer fram og treffer litt senere.
                const [len, y] = BARREL[by];
                const mx = f.x + ux * len;
                const mz = f.z + uz * len;
                fx.muzzle(mx, y, mz, ux, uz, by === 'vogn' || by === 'evogn' ? 1 : 0.8);
                const ty = Math.max(0.25, f.alt);
                fx.shell(mx, y, mz, f.x2, ty, f.z2, f.life);
                const hard = !!f.hard;
                fx.after(f.life, () => {
                    if (hard) fx.sparks(f.x2, ty, f.z2);
                    else fx.thud(f.x2, f.z2);
                    sound?.(hard ? 'klang' : 'nedslag');
                });
                sound?.(f.fiende ? 'ekanon' : 'kanon');
                if (!f.fiende) g.shake = Math.max(g.shake, 0.18);
            } else if (by === 'lv') {
                fx.flash(f.x + ux * 0.4, 0.55, f.z + uz * 0.4, 0.16);
                const tx = f.x2 + (Math.random() - 0.5) * 0.5;
                const tz = f.z2 + (Math.random() - 0.5) * 0.5;
                const ty = f.alt + (Math.random() - 0.3) * 0.4;
                fx.after(0.12, () => fx.flak(tx, ty, tz));
                sound?.('flak');
            } else if (by === 'jag' || by === 'ejag') {
                // Flyet skyter: to striper sporlys (mot bakken eller et annet fly).
                for (let k = 0; k < 2; k++) fx.tracer(f.x + (Math.random() - 0.5) * 0.3, AIR_ALT, f.z + (Math.random() - 0.5) * 0.3, f.x2 + (Math.random() - 0.5) * 0.5, f.alt > 0.3 ? f.alt : 0.15, f.z2 + (Math.random() - 0.5) * 0.5, !!f.fiende);
                sound?.('mg');
            } else {
                // Gevær og maskingevær: en liten flamme og støv der kulene slår ned.
                fx.flash(f.x + ux * 0.45, 0.4, f.z + uz * 0.45, f.fiende ? 0.12 : 0.15);
                // Sporlys: hver tredje kule i et belte lyser, så ikke alle skudd får strek.
                if (Math.random() < 0.55) fx.tracer(f.x + ux * 0.45, 0.4, f.z + uz * 0.45, f.x2 + (Math.random() - 0.5) * 0.3, Math.max(0.2, f.alt) + 0.1, f.z2 + (Math.random() - 0.5) * 0.3, !!f.fiende);
                if (f.alt < 0.3 && Math.random() < 0.6) fx.puff('støv', f.x2, 0.1, f.z2, { r: 0.08, grow: 2.2, life: 0.6, up: 0.4 });
                sound?.(RIFLE.has(by) ? (f.fiende ? 'egevær' : 'gevær') : 'gevær');
            }
        }
    }
}
