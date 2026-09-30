import * as THREE from 'three';
import { WALL_MAX, WAVES, COLS, ROWS, cellAt, type G, type EnemyKind, type Enemy, type Tower, type Fx, type Shot } from './game';
import { toWorld } from './geo';
import { HeightMap, WALL_TOP, type Region } from './terrain';
import { towerModels, FIG_SCALE } from './models';

// Alt som bare er pynt i Løpegravene: røyk, blod, deler som flyr, hatter, falne kropper,
// lyskuler og murstein som raser. Spillreglene (game.ts) vet ingenting om dette - de legger
// hendelser i g.fx, g.shots og g.flashes, og denne modulen leser dem én gang hver.
//
// Faste budsjetter overalt: bassengene er like store hele runden, og det eldste gjenbrukes.

const C = new THREE.Color();

// ---------------------------------------------------------------------------
// Partikler (THREE.Points): ett basseng med vanlig blanding, ett med additiv
// ---------------------------------------------------------------------------

export class PointPool {
    n: number;
    reserved: number;
    pos: Float32Array;
    vel: Float32Array;
    col: Float32Array;
    size: Float32Array;
    alpha: Float32Array;
    life: Float32Array;
    max: Float32Array;
    grow: Float32Array;
    drag: Float32Array;
    grav: Float32Array;
    a0: Float32Array;
    next: number;
    constructor(n: number, reserved = 0) {
        this.n = n;
        this.reserved = reserved;
        this.pos = new Float32Array(n * 3);
        this.vel = new Float32Array(n * 3);
        this.col = new Float32Array(n * 3);
        this.size = new Float32Array(n);
        this.alpha = new Float32Array(n);
        this.life = new Float32Array(n);
        this.max = new Float32Array(n);
        this.grow = new Float32Array(n);
        this.drag = new Float32Array(n);
        this.grav = new Float32Array(n);
        this.a0 = new Float32Array(n);
        this.next = reserved;
        for (let i = 0; i < n; i++) this.pos[i * 3 + 1] = -99;
    }
    spawn(
        x: number,
        y: number,
        z: number,
        vx: number,
        vy: number,
        vz: number,
        life: number,
        size: number,
        color: string | THREE.Color,
        alpha = 1,
        grow = 0,
        drag = 0,
        grav = 0
    ) {
        const i = this.next;
        this.next = this.next + 1 >= this.n ? this.reserved : this.next + 1;
        const k = i * 3;
        this.pos[k] = x;
        this.pos[k + 1] = y;
        this.pos[k + 2] = z;
        this.vel[k] = vx;
        this.vel[k + 1] = vy;
        this.vel[k + 2] = vz;
        if (typeof color === 'string') C.set(color);
        else C.copy(color);
        this.col[k] = C.r;
        this.col[k + 1] = C.g;
        this.col[k + 2] = C.b;
        this.size[i] = size;
        this.alpha[i] = alpha;
        this.a0[i] = alpha;
        this.life[i] = life;
        this.max[i] = life;
        this.grow[i] = grow;
        this.drag[i] = drag;
        this.grav[i] = grav;
    }
    /** Et fast punkt (lyskule, fakkel, lunte) - skrives hvert bilde. */
    set(i: number, x: number, y: number, z: number, size: number, color: string | THREE.Color, alpha: number) {
        const k = i * 3;
        this.pos[k] = x;
        this.pos[k + 1] = y;
        this.pos[k + 2] = z;
        if (typeof color === 'string') C.set(color);
        else C.copy(color);
        this.col[k] = C.r;
        this.col[k + 1] = C.g;
        this.col[k + 2] = C.b;
        this.size[i] = size;
        this.alpha[i] = alpha;
    }
    step(dt: number) {
        for (let i = this.reserved; i < this.n; i++) {
            if (this.life[i] <= 0) continue;
            this.life[i] -= dt;
            const k = i * 3;
            if (this.life[i] <= 0) {
                this.alpha[i] = 0;
                this.pos[k + 1] = -99;
                continue;
            }
            const dr = Math.max(0, 1 - this.drag[i] * dt);
            this.vel[k] *= dr;
            this.vel[k + 1] = this.vel[k + 1] * dr - this.grav[i] * dt;
            this.vel[k + 2] *= dr;
            this.pos[k] += this.vel[k] * dt;
            this.pos[k + 1] += this.vel[k + 1] * dt;
            this.pos[k + 2] += this.vel[k + 2] * dt;
            this.size[i] += this.grow[i] * dt;
            const f = this.life[i] / this.max[i];
            this.alpha[i] = this.a0[i] * Math.min(1, f * 2.2);
        }
    }
}

// ---------------------------------------------------------------------------
// Tunge biter: deler, hatter, flekker, kropper
// ---------------------------------------------------------------------------

export interface Chunk {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    rx: number;
    ry: number;
    rz: number;
    wx: number;
    wz: number;
    s: number;
    sy: number;
    color: string;
    life: number;
    ground: boolean;
}

export interface LooseHat {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    rx: number;
    ry: number;
    rz: number;
    spin: number;
    mitre: boolean;
    ground: boolean;
    life: number;
    /** Størrelsen på hatten (samme som figuren den falt av). */
    s: number;
}

export interface Decal {
    x: number;
    y: number;
    z: number;
    rot: number;
    s: number;
    color: string;
}

export interface Corpse {
    kind: EnemyKind;
    x: number;
    y: number;
    z: number;
    yaw: number;
    /** 0 = velter bakover, 1 = kastes opp (bombe/mine), 2 = kanon (skyves bakover). */
    style: 0 | 1 | 2;
    vx: number;
    vy: number;
    vz: number;
    spin: number;
    age: number;
    fall: number;
    tumble: number;
    ground: boolean;
    /** Rytterens hest faller sidelengs, kanonen kantrer. */
    roll: number;
}

export interface EVis {
    yaw: number;
    hatless: boolean;
    hit: number;
    dead: boolean;
    flee: number;
}

export interface TVis {
    yaw: number;
    recoil: number;
    shots: number;
    built: number;
    level: number;
    pop: number;
}

export interface Flare {
    phase: 'rise' | 'hang' | 'dead';
    t: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    wait: number;
    light: number;
}

/** Et lysspor etter en kule: flat ild stryker over grøfta, bomber tegner en bue ned i den. */
export interface Tracer {
    x0: number;
    y0: number;
    z0: number;
    x1: number;
    y1: number;
    z1: number;
    life: number;
    max: number;
    w: number;
    color: THREE.Color;
}
export const TRACER_MAX = 220;

export interface Merlon {
    down: number; // 0 = står, > 0 sekunder siden den falt
    x: number;
}

const BLOOD = ['#8e0f14', '#a3141a', '#6f0a0f'];
export const DECAL_MAX = 420;

export class Vis {
    hm = new HeightMap();
    boardV = -1;
    /** Rutenettet slik det var sist terrenget ble tegnet (for å finne det som er endret). */
    cellsSeen: string[] = [];
    /** Utsnittet terrengmeshen må fylle på nytt (null = alt). */
    dirty: Region | null = null;
    /** Øker når terrenget er fylt på nytt (grøfter, skanskurver). */
    terrainV = 0;
    /** Terrengmeshen har ikke hentet siste endring ennå (to endringer = fyll alt). */
    terrainPending = false;
    smoke = new PointPool(760, 0);
    glow = new PointPool(460, 64);
    chunks: Chunk[] = [];
    hats: LooseHat[] = [];
    decals: Decal[] = [];
    decalNext = 0;
    decalV = 0;
    corpses: Corpse[] = [];
    enemies = new Map<number, EVis>();
    towers = new Map<number, TVis>();
    flares: Flare[] = [
        { phase: 'dead', t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, wait: 0.2, light: 0 },
        { phase: 'dead', t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, wait: 5, light: 0 },
    ];
    merlons: Merlon[] = [];
    tracers: Tracer[] = Array.from({ length: TRACER_MAX }, () => ({
        x0: 0, y0: 0, z0: 0, x1: 0, y1: 0, z1: 0, life: 0, max: 1, w: 0.05, color: new THREE.Color(),
    }));
    tracerNext = 0;
    wall = WALL_MAX;
    /** Lyset fra siste smell (flyttes dit det smeller). */
    flash = { x: 0, y: 1, z: 6, i: 0 };
    seenFx = new WeakSet<Fx>();
    seenShot = new WeakSet<Shot>();
    seenFlash = new WeakSet<object>();
    time = 0;
    /** Svenskene flykter (seier) eller jubler (tap). */
    ending: '' | 'flukt' | 'jubel' = '';
    karlId = -1;
    /** Replikker som skal ut som lapper i verden (komponenten tømmer køen). */
    quips: { kind: 'hatless' | 'karl-hatt'; x: number; y: number; z: number }[] = [];
    constructor() {
        for (let i = 0; i < WALL_MAX; i++) this.merlons.push({ down: 0, x: -8.4 + (i * 16.8) / (WALL_MAX - 1) });
    }

    /** Terrengmeshen har fylt inn siste endring. */
    terrainTaken() {
        this.terrainPending = false;
    }

    reset(g: G) {
        this.hm.rebuild(g);
        this.boardV = g.boardV;
        this.cellsSeen = g.cells.map((r) => r.join(','));
        this.dirty = null;
        this.terrainV++;
        this.chunks = [];
        this.hats = [];
        this.decals = [];
        this.decalNext = 0;
        this.decalV++;
        this.corpses = [];
        this.enemies.clear();
        this.towers.clear();
        this.wall = g.wall;
        for (const m of this.merlons) m.down = 0;
        for (let i = this.smoke.reserved; i < this.smoke.n; i++) this.smoke.life[i] = 0.0001;
        for (let i = this.glow.reserved; i < this.glow.n; i++) this.glow.life[i] = 0.0001;
        this.ending = '';
        this.karlId = -1;
        this.quips = [];
        for (const t of this.tracers) t.life = 0;
    }

    // -----------------------------------------------------------------------
    // Byggesteiner for effekter
    // -----------------------------------------------------------------------

    /** Et lysspor fra a til b som blekner på `life` sekunder. */
    tracer(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, life: number, w: number, color: string) {
        const t = this.tracers[this.tracerNext++ % TRACER_MAX];
        t.x0 = x0;
        t.y0 = y0;
        t.z0 = z0;
        t.x1 = x1;
        t.y1 = y1;
        t.z1 = z1;
        t.life = life;
        t.max = life;
        t.w = w;
        t.color.set(color);
    }

    decal(x: number, z: number, s: number, color: string) {
        const d: Decal = { x, y: this.hm.at(x, z) + 0.012 + (this.decalNext % 7) * 0.0015, z, rot: Math.random() * 6.28, s, color };
        if (this.decals.length < DECAL_MAX) this.decals.push(d);
        else this.decals[this.decalNext % DECAL_MAX] = d;
        this.decalNext++;
        this.decalV++;
    }

    smokePuff(x: number, y: number, z: number, n: number, size: number, color: string, rise = 0.5, life = 2.4) {
        for (let i = 0; i < n; i++)
            this.smoke.spawn(
                x + (Math.random() - 0.5) * size * 0.4,
                y + Math.random() * size * 0.2,
                z + (Math.random() - 0.5) * size * 0.4,
                (Math.random() - 0.5) * 0.5 + 0.12,
                rise * (0.6 + Math.random() * 0.6),
                (Math.random() - 0.5) * 0.5 + 0.1,
                life * (0.7 + Math.random() * 0.6),
                size * (0.6 + Math.random() * 0.5),
                color,
                0.55 + Math.random() * 0.25,
                size * 0.45,
                0.9,
                -0.05
            );
    }

    sparks(x: number, y: number, z: number, n: number, speed: number, color: string, size = 0.12, life = 0.5) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const u = Math.random();
            this.glow.spawn(
                x,
                y,
                z,
                Math.cos(a) * speed * (0.3 + u),
                speed * (0.5 + Math.random()),
                Math.sin(a) * speed * (0.3 + u),
                life * (0.5 + Math.random()),
                size,
                color,
                1,
                -size * 0.8,
                0.6,
                6
            );
        }
    }

    flashAt(x: number, y: number, z: number, i: number) {
        if (i >= this.flash.i * 0.6) {
            this.flash.x = x;
            this.flash.y = y;
            this.flash.z = z;
            this.flash.i = Math.max(this.flash.i, i);
        }
    }

    blood(x: number, y: number, z: number, n: number, force: number, dirx = 0, dirz = 1) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            this.smoke.spawn(
                x,
                y,
                z,
                Math.cos(a) * force * 0.6 + dirx * force * 0.5,
                force * (0.8 + Math.random() * 0.9),
                Math.sin(a) * force * 0.6 + dirz * force * 0.5,
                0.7 + Math.random() * 0.5,
                0.1 + Math.random() * 0.12,
                BLOOD[i % 3],
                1,
                0,
                0.4,
                7
            );
        }
    }

    chunk(x: number, y: number, z: number, force: number, color: string, s: number) {
        const a = Math.random() * Math.PI * 2;
        const c: Chunk = {
            x,
            y,
            z,
            vx: Math.cos(a) * force * (0.4 + Math.random()),
            vy: force * (1 + Math.random() * 1.2),
            vz: Math.sin(a) * force * (0.4 + Math.random()),
            rx: Math.random() * 6,
            ry: Math.random() * 6,
            rz: Math.random() * 6,
            wx: (Math.random() - 0.5) * 14,
            wz: (Math.random() - 0.5) * 14,
            s,
            sy: s * (0.4 + Math.random() * 0.7),
            color,
            life: 18 + Math.random() * 10,
            ground: false,
        };
        if (this.chunks.length < 150) this.chunks.push(c);
        else {
            // Det eldste som ligger på bakken gjenbrukes.
            let j = 0;
            for (let k = 1; k < this.chunks.length; k++) if (this.chunks[k].life < this.chunks[j].life) j = k;
            this.chunks[j] = c;
        }
    }

    hatOff(x: number, y: number, z: number, mitre: boolean, force: number, s = FIG_SCALE.karoliner) {
        const a = Math.random() * Math.PI * 2;
        const h: LooseHat = {
            x,
            y,
            z,
            vx: Math.cos(a) * force * 0.5,
            vy: force * (1.6 + Math.random()),
            vz: Math.sin(a) * force * 0.5 + 0.3,
            rx: 0,
            ry: 0,
            rz: 0,
            spin: (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 10),
            mitre,
            ground: false,
            life: 40,
            s,
        };
        if (this.hats.length < 110) this.hats.push(h);
        else {
            let j = 0;
            for (let k = 1; k < this.hats.length; k++) if (this.hats[k].life < this.hats[j].life) j = k;
            this.hats[j] = h;
        }
    }

    // -----------------------------------------------------------------------
    // Hendelser fra spillet
    // -----------------------------------------------------------------------

    /** Muren tar skade ved x: steiner i brystvernet raser, én per murpoeng. */
    wallHit(g: G, x: number) {
        let lost = this.wall - g.wall;
        this.wall = g.wall;
        while (lost-- > 0) {
            let best: Merlon | null = null;
            for (const m of this.merlons)
                if (!m.down && (!best || Math.abs(m.x - x) < Math.abs(best.x - x))) best = m;
            if (!best) break;
            best.down = 0.0001;
            for (let k = 0; k < 4; k++) this.chunk(best.x, WALL_TOP + 0.2, 0.2, 1.2, '#77737a', 0.14);
            this.smokePuff(best.x, WALL_TOP + 0.1, 0.4, 3, 0.8, '#a39a8e', 0.6, 2.5);
        }
    }

    onDeath(e: Enemy) {
        const [wx, wz] = toWorld(e.x, e.z);
        const y = this.hm.at(wx, wz);
        const ev = this.enemies.get(e.id);
        const yaw = ev ? ev.yaw : Math.PI;
        const src = e.killedBy;
        const blast = src === 'bombe' || src === 'mine';
        const style: 0 | 1 | 2 = e.kind === 'beleiring' ? 2 : blast ? 1 : src === 'kanon' || src === 'kartesk' ? 2 : 0;
        const force = blast ? 2.6 + Math.random() * 1.6 : style === 2 ? 1.6 : 0.8;
        // Fra festningen og utover: kulene kommer forfra, kroppen kastes bakover.
        const bx = Math.sin(yaw);
        const bz = Math.cos(yaw);
        const c: Corpse = {
            kind: e.kind,
            x: wx,
            y,
            z: wz,
            yaw,
            style,
            vx: -bx * force * 0.45 + (Math.random() - 0.5) * (blast ? 1.4 : 0.3),
            vy: blast ? force : style === 2 ? 0.8 : 0,
            vz: -bz * force * 0.45 + (Math.random() - 0.5) * (blast ? 1.4 : 0.3),
            spin: blast ? (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 6) : 0,
            age: 0,
            fall: 0,
            tumble: 0,
            ground: !blast && style !== 2,
            roll: e.kind === 'rytter' || e.kind === 'beleiring' ? (Math.random() < 0.5 ? -1 : 1) : 0,
        };
        if (this.corpses.length >= 260) {
            let j = 0;
            for (let k = 1; k < this.corpses.length; k++) if (this.corpses[k].age > this.corpses[j].age) j = k;
            this.corpses[j] = c;
        } else this.corpses.push(c);
        if (e.kind === 'beleiring') {
            for (let k = 0; k < 10; k++) this.chunk(wx, y + 0.3, wz, 1.8, k % 2 ? '#3e2716' : '#9a7434', 0.12);
            this.smokePuff(wx, y + 0.3, wz, 8, 1.3, '#4a4440', 0.9, 3.2);
            this.sparks(wx, y + 0.4, wz, 18, 2.4, '#ffb347', 0.16, 0.8);
            this.decal(wx, wz, 1.3, '#191512');
            this.flashAt(wx, y + 0.8, wz, 1.4);
            return;
        }
        const fig = FIG_SCALE[e.kind];
        // Blodet: en tydelig sprut i slagretningen, og flekker som blir liggende i snøen.
        this.blood(wx, y + 0.34 * fig, wz, blast ? 26 : 16, blast ? 2.6 : 1.6, -bx, -bz);
        this.decal(wx - bx * 0.2, wz - bz * 0.2, (blast ? 0.62 : 0.46) * fig, BLOOD[Math.floor(Math.random() * 3)]);
        for (let k = 0; k < (blast ? 4 : 2); k++) {
            const t = 0.35 + k * 0.28 + Math.random() * 0.2;
            this.decal(
                wx - bx * t * fig * 0.6 + (Math.random() - 0.5) * (blast ? 0.9 : 0.3),
                wz - bz * t * fig * 0.6 + (Math.random() - 0.5) * (blast ? 0.9 : 0.3),
                (0.12 + Math.random() * 0.16) * fig,
                BLOOD[k % 3]
            );
        }
        // Hatten flyr (det er alltid noe komisk med en hatt som flyr).
        const hatted = e.kind === 'karoliner' || e.kind === 'livgarde' || e.kind === 'karl' || e.kind === 'grenader' || e.kind === 'rytter';
        if (hatted && !(ev && ev.hatless)) {
            const hy = y + (e.kind === 'rytter' ? 0.72 * fig : 0.56 * fig);
            this.hatOff(wx, hy, wz, e.kind === 'grenader', e.kind === 'karl' ? 3.4 : blast ? 2.8 : 1.2, fig);
            if (e.kind === 'karl') this.quips.push({ kind: 'karl-hatt', x: wx, y: hy + 1.2, z: wz });
        }
        // Gullet spretter.
        for (let k = 0; k < (e.kind === 'karl' ? 20 : 3); k++)
            this.glow.spawn(wx, y + 0.4, wz, (Math.random() - 0.5) * 1.2, 2 + Math.random() * 1.6, (Math.random() - 0.5) * 1.2, 0.9, 0.16, '#f2c14e', 1, -0.1, 0.3, 7);
    }

    /** Ett treff med musket: dekning = jord spruter fra kanten, åpen mark = blod. */
    musketHit(g: G, tx: number, tz: number): 0 | 1 | 2 {
        let best: Enemy | null = null;
        let bd = 0.6;
        for (const e of g.enemies) {
            if (e.dead || e.leaked) continue;
            const d = Math.hypot(e.x - tx, e.z - tz);
            if (d < bd) {
                bd = d;
                best = e;
            }
        }
        const [wx, wz] = toWorld(tx, tz);
        const y = this.hm.at(wx, wz);
        if (best && best.cover) {
            // Kula slår inn i jordvollen foran ham: snø og jord, ikke blod.
            const ev = this.enemies.get(best.id);
            const yaw = ev ? ev.yaw : Math.PI;
            const px = wx + Math.sin(yaw) * 0.32;
            const pz = wz + Math.cos(yaw) * 0.32;
            const py = this.hm.at(px, pz) + 0.08;
            for (let k = 0; k < 4; k++)
                this.smoke.spawn(px, py, pz, (Math.random() - 0.5) * 0.8, 1 + Math.random(), (Math.random() - 0.5) * 0.8, 0.5, 0.08, k % 2 ? '#dfe6ee' : '#4a3a2c', 1, 0, 0.3, 6);
            return 1;
        } else if (best) {
            const fig = FIG_SCALE[best.kind];
            this.blood(wx, y + 0.34 * fig, wz, 6, 1.1);
            if (Math.random() < 0.35) this.decal(wx + (Math.random() - 0.5) * 0.3, wz + 0.1 + Math.random() * 0.25, 0.16 * fig, BLOOD[1]);
            const ev = this.enemies.get(best.id);
            if (ev && !ev.hatless && (best.kind === 'karoliner' || best.kind === 'livgarde') && Math.random() < 0.18) {
                // Kula tok hatten, ikke mannen. Han marsjerer videre uten.
                ev.hatless = true;
                this.hatOff(wx, y + 0.56 * fig, wz, false, 1.1);
                this.quips.push({ kind: 'hatless', x: wx, y: y + 0.9 * fig, z: wz });
            }
            return 2;
        }
        return 0;
    }

    // -----------------------------------------------------------------------
    // Hvert bilde
    // -----------------------------------------------------------------------

    step(g: G, dt: number) {
        this.time += dt;
        if (g.boardV !== this.boardV) {
            this.boardV = g.boardV;
            // Bare rutene som er gravd siden sist tegnes på nytt (en Chromebook tåler ikke
            // å regne hele terrenget hvert sekund mens graverne graver).
            let x0 = 99;
            let x1 = -99;
            let z0 = 99;
            let z1 = -99;
            for (let z = 0; z < g.cells.length; z++) {
                const row = g.cells[z].join(',');
                if (row === this.cellsSeen[z]) continue;
                const old = (this.cellsSeen[z] ?? '').split(',');
                for (let x = 0; x < g.cells[z].length; x++)
                    if (old[x] !== g.cells[z][x]) {
                        const [wx, wz] = toWorld(x, z);
                        x0 = Math.min(x0, wx);
                        x1 = Math.max(x1, wx);
                        z0 = Math.min(z0, wz);
                        z1 = Math.max(z1, wz);
                    }
                this.cellsSeen[z] = row;
            }
            if (x0 <= x1) {
                const r: Region = [x0 - 1.3, x1 + 1.3, z0 - 1.3, z1 + (z1 >= 12.5 ? 4.5 : 1.3)];
                this.hm.rebuild(g, r);
                this.dirty = this.terrainPending ? null : r;
                this.terrainPending = true;
                this.terrainV++;
            }
        }
        const hm = this.hm;
        const TW = towerModels();

        // Nye hendelser fra spillreglene.
        for (const f of g.fx) {
            if (this.seenFx.has(f)) continue;
            this.seenFx.add(f);
            const [wx, wz] = toWorld(f.x, f.z);
            const y = hm.at(wx, wz);
            if (f.kind === 'smell') {
                const big = f.n >= 8;
                this.smokePuff(wx, y + 0.15, wz, big ? 6 : 3, big ? 1.1 : 0.7, big ? '#5e5650' : '#8a8177', 0.7, big ? 3 : 2.2);
                this.sparks(wx, y + 0.2, wz, big ? 16 : 7, big ? 2.6 : 1.6, '#ffb347', big ? 0.2 : 0.14, 0.45);
                this.glow.spawn(wx, y + 0.3, wz, 0, 0.4, 0, 0.22, big ? 2.4 : 1.3, '#ffcf7a', 1, 4, 0, 0);
                for (let k = 0; k < (big ? 10 : 5); k++)
                    this.smoke.spawn(wx, y + 0.05, wz, (Math.random() - 0.5) * 2.2, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 2.2, 0.8, 0.09, k % 3 ? '#e6ecf3' : '#4a3a2c', 1, 0, 0.3, 7);
                if (big) this.decal(wx, wz, 0.9, '#1d1916');
                this.flashAt(wx, y + 0.8, wz, big ? 1.6 : 0.8);
            } else if (f.kind === 'mine') {
                // Jorda løfter seg: en søyle av jord, snø og røyk.
                for (let k = 0; k < 22; k++)
                    this.smoke.spawn(wx + (Math.random() - 0.5) * 0.4, y, wz + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.6, 3 + Math.random() * 3.5, (Math.random() - 0.5) * 1.6, 1.1, 0.12 + Math.random() * 0.1, k % 3 ? '#3a2c22' : '#dfe6ee', 1, 0, 0.2, 8);
                this.smokePuff(wx, y + 0.3, wz, 7, 1.4, '#4c443e', 1.1, 3.4);
                this.sparks(wx, y + 0.2, wz, 14, 3, '#ff9a3c', 0.2, 0.5);
                this.glow.spawn(wx, y + 0.4, wz, 0, 0.6, 0, 0.3, 3, '#ffc466', 1, 5, 0, 0);
                for (let k = 0; k < 4; k++) this.chunk(wx, y + 0.2, wz, 1.8, k % 2 ? '#3a2c22' : '#5a3b22', 0.1);
                this.decal(wx, wz, 1.2, '#16120f');
                this.flashAt(wx, y + 1, wz, 2.2);
            } else if (f.kind === 'knust') {
                for (let k = 0; k < 14; k++) this.chunk(wx, y + 0.4, wz, 2, k % 3 === 0 ? '#77737a' : k % 3 === 1 ? '#7a5534' : '#3e2716', 0.13);
                this.smokePuff(wx, y + 0.3, wz, 9, 1.5, '#6a625a', 0.8, 3.6);
                this.sparks(wx, y + 0.4, wz, 16, 2.4, '#ffb347', 0.16, 0.9);
                this.decal(wx, wz, 1.3, '#16120f');
                this.flashAt(wx, y + 1, wz, 1.8);
            } else if (f.kind === 'røyk') {
                this.smokePuff(wx, y + 0.5, wz, 2, 0.7, '#8a8177', 0.6, 1.8);
                this.sparks(wx, y + 0.5, wz, 6, 1.4, '#ffb347', 0.12, 0.4);
                for (let k = 0; k < 2; k++) this.chunk(wx, y + 0.5, wz, 1.2, '#7a5534', 0.08);
            }
        }
        // Nye skudd: munningsflamme og krutrøyk der det ble skutt fra.
        for (const s of g.shots) {
            if (this.seenShot.has(s)) continue;
            this.seenShot.add(s);
            if (s.t < 0) {
                this.seenShot.delete(s); // Bombardér: bombe nummer to går litt etter
                continue;
            }
            const [wx, wz] = toWorld(s.x0, s.z0);
            const y = hm.at(wx, wz);
            if (s.kind === 'kanon' || s.kind === 'bombe') {
                const t = g.towers.find((x) => x.id === s.tower);
                const m = t ? TW[t.kind][t.level] : null;
                const [tx, tz] = toWorld(s.x1, s.z1);
                const dx = tx - wx;
                const dz = tz - wz;
                const L = Math.hypot(dx, dz) || 1;
                const mx = wx + (dx / L) * (m ? m.muzzle[2] : 0.4);
                const mz = wz + (dz / L) * (m ? m.muzzle[2] : 0.4);
                const my = y + (m ? m.topY + m.muzzle[1] : 0.4);
                const big = s.kind === 'kanon';
                this.glow.spawn(mx, my, mz, (dx / L) * 1.5, 0.2, (dz / L) * 1.5, 0.12, big ? 1.2 : 0.9, '#ffd27a', 1, 3, 0, 0);
                this.smokePuff(mx, my, mz, big ? 4 : 3, big ? 1 : 0.8, '#d9d1c4', 0.45, 2.8);
                this.flashAt(mx, my + 0.3, mz, big ? 1 : 0.7);
            } else {
                this.glow.spawn(wx, y + 0.5, wz, 0, 0.2, 0, 0.12, 1, '#ffb05a', 1, 3, 0, 0);
                this.smokePuff(wx, y + 0.45, wz, s.kind === 'beleiring' ? 4 : 1, 1, '#b6aea2', 0.45, 2.6);
                if (s.kind === 'beleiring') this.flashAt(wx, y + 1, wz, 1);
            }
        }
        for (const f of g.flashes) {
            if (this.seenFlash.has(f)) continue;
            this.seenFlash.add(f);
            const [wx, wz] = toWorld(f.x, f.z);
            const [tx, tz] = toWorld(f.tx, f.tz);
            const dx = tx - wx;
            const dz = tz - wz;
            const L = Math.hypot(dx, dz) || 1;
            const t = g.towers.find((o) => o.cx === f.x && o.cz === f.z && !o.fallen);
            const m = t ? TW.musketer[t.level] : TW.musketer[0];
            const y = hm.at(wx, wz) + m.topY + 0.42;
            const mx = wx + (dx / L) * 0.35;
            const mz = wz + (dz / L) * 0.35;
            this.glow.spawn(mx, y, mz, (dx / L) * 2, 0, (dz / L) * 2, 0.08, 0.55, '#ffe0a0', 1, 2, 0, 0);
            this.smokePuff(mx, y, mz, 2, 0.55, '#e2dbcf', 0.3, 2.4);
            const hit = this.musketHit(g, f.tx, f.tz);
            // Kulesporet: mot en mann i grøfta stryker det flatt over hodet hans og videre,
            // på åpen mark ender det i ham.
            const ty = hm.at(tx, tz);
            if (hit === 1) this.tracer(mx, y, mz, tx + (dx / L) * 1.1, ty + 0.95, tz + (dz / L) * 1.1, 0.3, 0.045, '#ffe7b0');
            else this.tracer(mx, y, mz, tx, ty + 0.55, tz, 0.24, 0.045, '#ffd89a');
        }

        // Fiendene: dødsfall og retning.
        for (const e of g.enemies) {
            let ev = this.enemies.get(e.id);
            if (!ev) {
                ev = { yaw: Math.PI, hatless: false, hit: 0, dead: false, flee: 0 };
                this.enemies.set(e.id, ev);
                if (e.kind === 'karl') this.karlId = e.id;
            }
            if (e.dead && !ev.dead) {
                ev.dead = true;
                this.onDeath(e);
            }
        }
        if (this.enemies.size > 700)
            for (const id of this.enemies.keys()) {
                if (!g.enemies.some((e) => e.id === id)) this.enemies.delete(id);
                if (this.enemies.size < 450) break;
            }

        // Tårnene: rekyl, ferdig bygd, knust.
        for (const t of g.towers) {
            let tv = this.towers.get(t.id);
            if (!tv) {
                tv = { yaw: 0, recoil: 0, shots: t.shots, built: t.built, level: t.level, pop: 0 };
                this.towers.set(t.id, tv);
                const [wx, wz] = toWorld(t.cx, t.cz);
                this.smokePuff(wx, hm.at(wx, wz) + 0.1, wz, 3, 0.8, '#cfc8bd', 0.4, 1.6);
            }
            if (t.shots !== tv.shots) {
                tv.shots = t.shots;
                tv.recoil = 1;
            }
            if (t.built >= 1 && tv.built < 1) {
                tv.pop = 1;
                const [wx, wz] = toWorld(t.cx, t.cz);
                const y = hm.at(wx, wz);
                this.smokePuff(wx, y + 0.1, wz, 4, 0.9, '#d8d2c6', 0.5, 1.8);
                for (let k = 0; k < 6; k++) this.chunk(wx, y + 0.5, wz, 1, '#a57c4f', 0.06);
            }
            tv.built = t.built;
            tv.level = t.level;
            tv.recoil = Math.max(0, tv.recoil - dt * 5);
            tv.pop = Math.max(0, tv.pop - dt * 3);
        }

        // Murens brystvern.
        if (g.wall < this.wall) this.wallHit(g, 0);
        for (const m of this.merlons) if (m.down) m.down += dt;

        this.stepChunks(dt);
        this.stepHats(dt);
        this.stepCorpses(dt);
        this.stepFlares(g, dt);
        this.flash.i = Math.max(0, this.flash.i - dt * 7);
        this.smoke.step(dt);
        for (const t of this.tracers) if (t.life > 0) t.life -= dt;
        this.glow.step(dt);
    }

    stepChunks(dt: number) {
        for (let i = this.chunks.length - 1; i >= 0; i--) {
            const c = this.chunks[i];
            c.life -= dt;
            if (c.life <= 0) {
                this.chunks.splice(i, 1);
                continue;
            }
            if (c.ground) continue;
            c.vy -= 9 * dt;
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.z += c.vz * dt;
            c.rx += c.wx * dt;
            c.rz += c.wz * dt;
            const gy = this.hm.at(c.x, c.z) + c.sy * 0.4;
            if (c.y <= gy) {
                c.y = gy;
                if (c.vy < -2.5) {
                    c.vy *= -0.3;
                    c.vx *= 0.5;
                    c.vz *= 0.5;
                } else {
                    c.ground = true;
                    c.rx = Math.round(c.rx / (Math.PI / 2)) * (Math.PI / 2);
                    c.rz = Math.round(c.rz / (Math.PI / 2)) * (Math.PI / 2);
                }
            }
        }
    }

    stepHats(dt: number) {
        for (let i = this.hats.length - 1; i >= 0; i--) {
            const h = this.hats[i];
            h.life -= dt;
            if (h.life <= 0) {
                this.hats.splice(i, 1);
                continue;
            }
            if (h.ground) continue;
            h.vy -= 7 * dt;
            h.vx *= 1 - dt * 0.6;
            h.vz *= 1 - dt * 0.6;
            h.x += h.vx * dt;
            h.y += h.vy * dt;
            h.z += h.vz * dt;
            h.ry += h.spin * dt;
            h.rx += h.spin * 0.4 * dt;
            const gy = this.hm.at(h.x, h.z) + 0.02;
            if (h.y <= gy && h.vy < 0) {
                h.y = gy;
                h.ground = true;
                h.rx = Math.random() < 0.3 ? Math.PI : 0.12; // noen lander opp ned
                h.rz = (Math.random() - 0.5) * 0.3;
            }
        }
    }

    stepCorpses(dt: number) {
        for (const c of this.corpses) {
            c.age += dt;
            if (c.style === 0) {
                // Velter bakover med et lite sprett.
                c.fall = Math.min(1, c.fall + dt * 3.2);
                continue;
            }
            if (c.ground) {
                c.fall = Math.min(1, c.fall + dt * 4);
                continue;
            }
            c.vy -= 8.5 * dt;
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.z += c.vz * dt;
            c.tumble += c.spin * dt;
            c.fall = Math.min(1, c.fall + dt * 2);
            const gy = this.hm.at(c.x, c.z);
            if (c.y <= gy && c.vy < 0) {
                c.y = gy;
                if (c.vy < -3) {
                    c.vy *= -0.25;
                    c.vx *= 0.4;
                    c.vz *= 0.4;
                    c.spin *= 0.3;
                } else {
                    c.ground = true;
                    c.tumble = Math.round(c.tumble / Math.PI) * Math.PI;
                }
            }
        }
    }

    stepFlares(g: G, dt: number) {
        const karl = this.karlId >= 0 ? g.enemies.find((e) => e.id === this.karlId && !e.dead) : null;
        for (let i = 0; i < this.flares.length; i++) {
            const f = this.flares[i];
            f.t += dt;
            if (f.phase === 'dead') {
                f.light = Math.max(0, f.light - dt * 2);
                f.wait -= dt;
                if (f.wait <= 0) {
                    // Skutt opp fra muren, mot marka der fienden er (eller mot kongen).
                    f.phase = 'rise';
                    f.t = 0;
                    f.x = (Math.random() - 0.5) * 10;
                    f.y = WALL_TOP + 0.3;
                    f.z = 0.2;
                    let tx = (Math.random() - 0.5) * 12;
                    let tz = 6 + Math.random() * 4;
                    // Lyskula skytes over grøftene der svenskene er, så de synes i mørket.
                    const foe = pickFoe(g, i);
                    if (foe) {
                        const [ex, ez] = toWorld(foe.x, foe.z);
                        tx = ex + (Math.random() - 0.5) * 1.5;
                        tz = ez + 0.6;
                    }
                    if (karl) {
                        const [kx, kz] = toWorld(karl.x, karl.z);
                        tx = kx + (Math.random() - 0.5) * 2;
                        tz = kz + 0.5;
                    }
                    f.vx = (tx - f.x) / 1.3;
                    f.vz = (tz - f.z) / 1.3;
                    f.vy = 5.6;
                }
                continue;
            }
            if (f.phase === 'rise') {
                f.vy -= 4.2 * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.z += f.vz * dt;
                f.light = Math.min(1, f.light + dt * 1.5);
                this.glow.spawn(f.x, f.y, f.z, 0, -0.2, 0, 0.5, 0.14, '#ffc56a', 0.9, -0.1, 0, 0);
                if (f.vy <= 0.2 || f.t > 1.5) {
                    f.phase = 'hang';
                    f.t = 0;
                    f.vx *= 0.1;
                    f.vz *= 0.1;
                }
                continue;
            }
            // Henger over marka og synker sakte (fallskjerm av tøy og vind).
            f.x += (f.vx + Math.sin(this.time * 0.7 + i) * 0.12) * dt;
            f.z += f.vz * dt;
            f.y -= dt * 0.24;
            f.light = Math.min(1, f.light + dt * 2) * (0.9 + Math.random() * 0.1);
            if (Math.random() < dt * 6) this.smoke.spawn(f.x, f.y + 0.1, f.z, 0.05, 0.25, 0.02, 3, 0.35, '#b8aea0', 0.3, 0.25, 0.2, -0.02);
            if (f.y < 1.2 || f.t > 12) {
                f.phase = 'dead';
                f.wait = 0.6 + Math.random() * 1.6;
            }
        }
    }

    /** Siste bølge vunnet: svenskene snur og flykter. Tapt: de kaster hattene i været. */
    finale(g: G, won: boolean) {
        this.ending = won ? 'flukt' : 'jubel';
        if (won) return;
        for (const e of g.enemies) {
            if (e.dead) continue;
            const ev = this.enemies.get(e.id);
            if (!ev || ev.hatless) continue;
            if (e.kind === 'karoliner' || e.kind === 'livgarde' || e.kind === 'grenader' || e.kind === 'karl') {
                ev.hatless = true;
                const [wx, wz] = toWorld(e.x, e.z);
                this.hatOff(wx, this.hm.at(wx, wz) + 0.56 * FIG_SCALE[e.kind], wz, e.kind === 'grenader', 1.6);
            }
        }
    }
}

/** En fiende lyskula kan lyse opp: annenhver kule tar den fremste, den andre en tilfeldig. */
function pickFoe(g: G, i: number): Enemy | null {
    let best: Enemy | null = null;
    let n = 0;
    for (const e of g.enemies) {
        if (e.dead || e.leaked) continue;
        n++;
        if (i === 0 ? !best || e.d > best.d : Math.random() < 1 / n) best = e;
    }
    return best;
}

/** Visningsposisjon for et tårn i verden (bunnen står på bakken). */
export function towerBase(v: Vis, t: Tower): [number, number, number] {
    const [wx, wz] = toWorld(t.cx, t.cz);
    return [wx, v.hm.at(wx, wz), wz];
}

const frontCache = { v: -1, x: 0, z: 0, ok: false };
/** Den fremste grøfteruta: nærmest muren, og nærmest midten ved likt. */
export function frontTrench(g: G): [number, number] | null {
    if (frontCache.v !== g.boardV) {
        frontCache.v = g.boardV;
        frontCache.ok = false;
        let bz = 1e9;
        let bx = 1e9;
        for (let cz = 0; cz < ROWS; cz++)
            for (let cx = 0; cx < COLS; cx++) {
                if (cellAt(g, cx, cz) !== 'grav') continue;
                const off = Math.abs(cx - (COLS - 1) / 2);
                if (cz < bz || (cz === bz && off < bx)) {
                    bz = cz;
                    bx = off;
                    frontCache.x = cx;
                    frontCache.z = cz;
                    frontCache.ok = true;
                }
            }
    }
    return frontCache.ok ? [frontCache.x, frontCache.z] : null;
}

/** Står kongen og ser fra grøfta nå? Byggepausen før natt 9, og natt 9 til han går selv. */
export function karlWatching(g: G, vis: Vis) {
    if (g.endless || g.ended || vis.karlId >= 0) return false;
    return (g.phase === 'bygg' && g.wave === WAVES - 1) || (g.phase === 'bolge' && g.wave === WAVES);
}

/** Der kongen er (i verden): stående i grøfta eller i angrep. Null når han ikke er med. */
export function karlSpot(g: G, vis: Vis, out: THREE.Vector3): THREE.Vector3 | null {
    if (karlWatching(g, vis)) {
        const f = frontTrench(g);
        if (!f) return null;
        const [wx, wz] = toWorld(f[0], f[1]);
        return out.set(wx, vis.hm.at(wx, wz), wz + 0.15);
    }
    const k = vis.karlId >= 0 ? g.enemies.find((e) => e.id === vis.karlId && !e.dead && !e.leaked) : null;
    if (!k) return null;
    const [wx, wz] = toWorld(k.x, k.z);
    return out.set(wx, vis.hm.at(wx, wz), wz);
}
