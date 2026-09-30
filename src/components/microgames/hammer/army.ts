import * as THREE from 'three';
import {
    UNITS,
    COL_X,
    ROW_Z,
    COLS,
    terrain,
    type G,
    type Kind,
    type Klasse,
    type GameEvent,
    type Terrain,
} from './game';
import { PAL } from './models';

// HAMMER OG AMBOLT - den synlige hæren.
//
// Spillreglene (game.ts) regner med én «squad» per enhet: et punkt med liv. Her blir hver
// squad en blokk med mange små soldater som marsjerer, stormer, stikker og flyr i buer når
// de dør. Alt her er pynt: ingenting leses tilbake av spillreglene, så utfallet av et slag
// er det samme med og uten denne fila (simuleringen kjører uten den).
//
// Fast budsjett: MAX_FIG figurer, MAX_ARROW piler, faste partikkelpooler. Ingen new i
// løkka - alt gjenbrukes.

export const MAX_FIG = 420;
/** Figurene er litt større enn livet, så silhuettene leses fra planleggingskameraet. */
const FIG = 1.2;
const MAX_ARROW = 260;
const MAX_SOFT = 240;
const MAX_HARD = 280;
const MAX_GLOW = 110;
const MAX_SPLAT = 150;
const GRAV = 18;

type FigType = 'inf' | 'kav' | 'vogn' | 'ele';

interface Look {
    fig: FigType;
    n: [number, number, number];
    cols: number;
    sp: number;
    shield: number;
    spear: number;
    bow: number;
    helm: string;
    crest?: boolean;
    loose?: boolean;
    sling?: boolean;
}

const BRONZE = '#c9973f';
const CAP = '#efe3c8';
const HIDE = '#6b4a2c';
const DARK = '#2a221c';
const HAT = '#d9a441';

const inf = (o: Partial<Look>): Look => ({ fig: 'inf', n: [8, 10, 12], cols: 4, sp: 0.48, shield: 1, spear: 1.3, bow: 0, helm: BRONZE, ...o });
const kav = (o: Partial<Look>): Look => ({ fig: 'kav', n: [4, 6, 8], cols: 2, sp: 0.8, shield: 0, spear: 1.5, bow: 0, helm: BRONZE, ...o });

const LOOK: Record<Kind, Look> = {
    falanks: inf({ spear: 2.9, shield: 0.72 }),
    hoplitt: inf({ spear: 1.4, shield: 1.05, crest: true }),
    udodelig: inf({ spear: 1.3, shield: 0.95, helm: CAP }),
    hypaspist: inf({ n: [6, 8, 10], cols: 3, sp: 0.52, spear: 1.2, shield: 0.95 }),
    agrianer: inf({ n: [6, 8, 10], cols: 3, sp: 0.58, spear: 0.85, shield: 0.62, helm: HIDE, loose: true }),
    kardak: inf({ n: [6, 8, 10], cols: 3, sp: 0.56, spear: 1.0, shield: 0.62, helm: CAP, loose: true }),
    kreter: inf({ n: [6, 8, 10], cols: 3, sp: 0.56, spear: 0, shield: 0, bow: 1, helm: HIDE, loose: true }),
    bue: inf({ n: [6, 8, 10], cols: 3, sp: 0.56, spear: 0, shield: 0, bow: 1, helm: CAP, loose: true }),
    slynge: inf({ n: [6, 8, 10], cols: 3, sp: 0.58, spear: 0, shield: 0, bow: 0, helm: HIDE, loose: true, sling: true }),
    inder: inf({ n: [6, 8, 10], cols: 3, sp: 0.56, spear: 0, shield: 0, bow: 1.5, helm: CAP, loose: true }),
    hetairoi: kav({ spear: 1.7, helm: BRONZE, crest: true }),
    tessaler: kav({ spear: 1.4, helm: HAT }),
    asp: kav({ spear: 1.2, helm: CAP }),
    baktrer: kav({ spear: 1.3, helm: HIDE }),
    skyter: kav({ spear: 0, bow: 1, helm: DARK, loose: true }),
    dahe: kav({ spear: 0, bow: 1, helm: HIDE, loose: true }),
    indrytter: kav({ spear: 1.2, helm: CAP }),
    vogn: { fig: 'vogn', n: [2, 3, 3], cols: 2, sp: 1.15, shield: 0, spear: 0, bow: 0, helm: CAP },
    elefant: { fig: 'ele', n: [1, 2, 3], cols: 3, sp: 1.2, shield: 0, spear: 0, bow: 0, helm: CAP },
    aleksander: kav({ n: [3, 3, 3], spear: 1.7, crest: true }),
    parmenion: inf({ n: [5, 5, 5], cols: 3, sp: 0.52, spear: 1.4, shield: 1.05, crest: true }),
    mazaios: kav({ n: [3, 3, 3], spear: 1.3, helm: CAP, crest: true }),
    oxyartes: kav({ n: [3, 3, 3], spear: 0, bow: 1, helm: DARK, crest: true }),
    poros: { fig: 'ele', n: [1, 1, 1], cols: 1, sp: 1.2, shield: 0, spear: 0, bow: 0, helm: CAP },
    dareios: { fig: 'vogn', n: [1, 1, 1], cols: 1, sp: 1.2, shield: 0, spear: 0, bow: 0, helm: HAT },
};

const CLOTH: Record<0 | 1, Record<Klasse, string>> = {
    0: { tung: '#a4402a', lett: '#bb5a39', skytter: '#c4703f', kav: '#93321e', vogn: '#a4402a', elefant: '#a4402a' },
    1: { tung: '#4a3220', lett: '#6b4a2c', skytter: '#d9a441', kav: '#3a2618', vogn: '#d9a441', elefant: '#4a3220' },
};
const SHIELD_COL: Record<0 | 1, string> = { 0: '#e0ac48', 1: '#e9dcc0' };
const HERO_CLOTH: Partial<Record<Kind, string>> = {
    aleksander: '#e6b24c',
    parmenion: '#8e1c14',
    mazaios: '#efe3c8',
    oxyartes: '#d9a441',
    poros: '#d9a441',
    dareios: '#efe3c8',
};
const COATS = ['#7a4f2e', '#3a2a1f', '#a39686', '#8a5a34', '#5a3f2a'];

// ---------------------------------------------------------------------------
// Terrenget: høyden på bakken (samme funksjon tegner bakken i world.tsx)
// ---------------------------------------------------------------------------

const sstep = (a: number, b: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

export function groundY(ter: Terrain, x: number, z: number): number {
    let h = 0;
    // Åser langt unna, så horisonten ikke er en strek.
    h += sstep(12, 30, x) * 5 + sstep(16, 34, Math.abs(z)) * 3;
    h += Math.sin(x * 0.31 + z * 0.17) * 0.08 + Math.sin(z * 0.23 - x * 0.12) * 0.1;
    if (ter === 'hoyde') h += sstep(1.2, 6.5, z) * 2.2 + sstep(9, 14, z) * 1.6;
    if (ter === 'elv') {
        const d = Math.abs(z);
        if (d < 1.6) h -= 0.32 * (1 - (d / 1.6) * (d / 1.6));
    }
    if (ter === 'smalt') {
        h -= sstep(-5.2, -8.5, x) * 0.7;
        h += sstep(4.4, 6.4, x) * 2.4 + sstep(6.4, 9, x) * 3;
    }
    if (ter === 'steppe') h += Math.sin(x * 0.18) * Math.cos(z * 0.14) * 0.35;
    return h;
}

// ---------------------------------------------------------------------------
// Figurer, squads, piler, partikler
// ---------------------------------------------------------------------------

const St = {
    Form: 0,
    Fly: 1,
    Corpse: 2,
    Exit: 3,
    Suck: 4,
    Tumble: 5,
    Down: 6,
} as const;
type St = (typeof St)[keyof typeof St];

interface Fig {
    on: boolean;
    sq: VSq | null;
    type: FigType;
    kind: Kind;
    side: 0 | 1;
    lead: boolean;
    st: St;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    yaw: number;
    pitch: number;
    roll: number;
    wp: number;
    wr: number;
    lx: number;
    lz: number;
    row: number;
    ph: number;
    t: number;
    delay: number;
    scale: number;
    pop: number;
    moving: number;
    spear: number;
    lun: number;
    lie: number;
    bounced: boolean;
    tx: number;
    tz: number;
    cloth: THREE.Color;
    helm: THREE.Color;
    coat: THREE.Color;
    age: number;
}

interface VSq {
    key: string;
    side: 0 | 1;
    kind: Kind;
    star: number;
    look: Look;
    klasse: Klasse;
    hero: boolean;
    x: number;
    z: number;
    fx: number;
    fz: number;
    frac: number;
    figs: Fig[];
    seen: number;
    engaged: boolean;
    moving: boolean;
    panic: boolean;
    fled: boolean;
    dead: boolean;
    buff: string;
    rampage: boolean;
    grow: number;
    hitDx: number;
    hitDz: number;
    dustT: number;
    id: number;
}

interface Arrow {
    on: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    stuck: boolean;
    life: number;
    len: number;
    yaw: number;
    pitch: number;
    delay: number;
}

interface Pt {
    on: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    age: number;
    life: number;
    s0: number;
    s1: number;
    col: THREE.Color;
    a0: number;
    grav: number;
    drag: number;
    bounce: number;
    splat: boolean;
}

interface Splat {
    on: boolean;
    x: number;
    y: number;
    z: number;
    s: number;
    rot: number;
    age: number;
    grow: number;
    fade: number;
}

interface Target {
    key: string;
    side: 0 | 1;
    kind: Kind;
    star: number;
    x: number;
    z: number;
    fx: number;
    fz: number;
    frac: number;
    dead: boolean;
    fled: boolean;
    engaged: boolean;
    moving: boolean;
    panic: boolean;
    buff: string;
    rampage: boolean;
    id: number;
}

export interface ArmyMeshes {
    cloth: THREE.InstancedMesh;
    gear: THREE.InstancedMesh;
    helm: THREE.InstancedMesh;
    crest: THREE.InstancedMesh;
    shield: THREE.InstancedMesh;
    spear: THREE.InstancedMesh;
    bow: THREE.InstancedMesh;
    horse: THREE.InstancedMesh;
    chariot: THREE.InstancedMesh;
    elephant: THREE.InstancedMesh;
    tower: THREE.InstancedMesh;
    standard: THREE.InstancedMesh;
    arrow: THREE.InstancedMesh;
    splat: THREE.InstancedMesh;
    blob: THREE.InstancedMesh | null;
    soft: THREE.InstancedMesh;
    hard: THREE.InstancedMesh;
    glow: THREE.InstancedMesh;
}

export interface ArmySound {
    yelp: (big: boolean) => void;
    thud: () => void;
    arrows: () => void;
    whoosh: () => void;
    boom: () => void;
    coin: () => void;
}

/** Et punkt i verden der kameraet kan dykke ned. */
export interface Moment {
    kind: 'kile' | 'storkonge' | 'elefant' | 'sti' | 'bolge' | 'smelt' | 'parthisk';
    x: number;
    z: number;
    pri: number;
}

// Midlertidige objekter (ingen new i løkka)
const M = new THREE.Matrix4();
const F = new THREE.Matrix4();
const B = new THREE.Matrix4();
const L = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const EY = new THREE.Euler(0, 0, 0, 'YXZ');
const EX = new THREE.Euler();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const C = new THREE.Color();
const WHITE = new THREE.Color('#ffffff');

const mat = (x: number, y: number, z: number, s = 1, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Matrix4();
    m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
    return m;
};
const L_RIDER = mat(0, 0.5, -0.06);
const L_DRIVER = mat(0, 0.46, -0.04);
const L_HORSE_A = mat(-0.25, 0, 1.12, 0.95);
const L_HORSE_B = mat(0.25, 0, 1.12, 0.95);
const L_MAHOUT = mat(0, 1.34, 0.56, 0.78);
const L_ARCHER = mat(0, 1.5, -0.1, 0.8);
const L_BOW = mat(-0.23, 0.6, 0.14);
const L_STANDARD = mat(0.35, 0, -0.35);

function rand(a: number, b: number) {
    return a + Math.random() * (b - a);
}

export class Army {
    figs: Fig[] = [];
    sqs = new Map<string, VSq>();
    /** Hesteskyttere som skyter det parthiske skuddet: nøkkel -> til når. */
    private parth = new Map<string, number>();
    arrows: Arrow[] = [];
    soft: Pt[] = [];
    hard: Pt[] = [];
    glow: Pt[] = [];
    splats: Splat[] = [];
    meshes: ArmyMeshes | null = null;
    sound: ArmySound | null = null;
    particleScale = 1;
    time = 0;
    ter: Terrain = 'slette';
    /** Siste øyeblikk verdt et kameradykk (leses og nullstilles av kameraet). */
    moment: Moment | null = null;
    private seen = 0;
    private arrowI = 0;
    private splatI = 0;
    private mergeAt: { x: number; z: number; t: number } | null = null;
    private impulses: { x: number; z: number; t: number; pow: number }[] = [];
    private hold = 0;
    private frozen: Target[] = [];
    private winSide: -1 | 0 | 1 = -1;
    private phase = '';
    private firstBig = false;
    private raged = false;
    private yelpT = 0;
    private thudT = 0;
    private arrowT = 0;

    constructor() {
        for (let i = 0; i < MAX_FIG; i++)
            this.figs.push({
                on: false,
                sq: null,
                type: 'inf',
                kind: 'falanks',
                side: 0,
                lead: false,
                st: St.Form,
                x: 0,
                y: 0,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                yaw: 0,
                pitch: 0,
                roll: 0,
                wp: 0,
                wr: 0,
                lx: 0,
                lz: 0,
                row: 0,
                ph: Math.random() * 10,
                t: 0,
                delay: 0,
                scale: 1,
                pop: 1,
                moving: 0,
                spear: -1.3,
                lun: 0,
                lie: 1,
                bounced: false,
                tx: 0,
                tz: 0,
                cloth: new THREE.Color(),
                helm: new THREE.Color(),
                coat: new THREE.Color(),
                age: 0,
            });
        for (let i = 0; i < MAX_ARROW; i++)
            this.arrows.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, stuck: false, life: 0, len: 1, yaw: 0, pitch: 0, delay: 0 });
        const mk = (n: number, arr: Pt[]) => {
            for (let i = 0; i < n; i++)
                arr.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, life: 1, s0: 1, s1: 1, col: new THREE.Color(), a0: 1, grav: 0, drag: 0, bounce: 0, splat: false });
        };
        mk(MAX_SOFT, this.soft);
        mk(MAX_HARD, this.hard);
        mk(MAX_GLOW, this.glow);
        for (let i = 0; i < MAX_SPLAT; i++) this.splats.push({ on: false, x: 0, y: 0, z: 0, s: 1, rot: 0, age: 0, grow: 0, fade: 0 });
    }

    reset() {
        for (const f of this.figs) f.on = false;
        for (const a of this.arrows) a.on = false;
        for (const p of this.soft) p.on = false;
        for (const p of this.hard) p.on = false;
        for (const p of this.glow) p.on = false;
        for (const s of this.splats) s.on = false;
        this.sqs.clear();
        this.parth.clear();
        this.impulses.length = 0;
        this.hold = 0;
        this.frozen = [];
        this.winSide = -1;
        this.moment = null;
        this.mergeAt = null;
    }

    /** Hendelser fra spillreglene behandles med en gang (tilstanden er fersk akkurat nå). */
    push(e: GameEvent, g: G) {
        this.onEvent(g, e);
    }

    private keyOf(g: G, id: number): string {
        const s = g.squads[id];
        return s && s.id === id ? keyOfSquad(s.side, s.kind, s.row, s.col, s.uid) : '';
    }

    /** Sant mens slaget holdes på skjermen etter at det er avgjort. */
    holding() {
        return this.hold > 0;
    }
    winner() {
        return this.winSide;
    }

    /** Midtpunktet av det som skjer (for kameraet). */
    focus(out: THREE.Vector3): THREE.Vector3 {
        let sx = 0;
        let sz = 0;
        let w = 0;
        for (const q of this.sqs.values()) {
            if (q.dead || q.fled) continue;
            const k = q.engaged ? 3 : 1;
            sx += q.x * k;
            sz += q.z * k;
            w += k;
        }
        if (!w) return out.set(0, 0, 0);
        return out.set(sx / w, 0, sz / w);
    }

    // -----------------------------------------------------------------------
    // Oppdatering
    // -----------------------------------------------------------------------

    update(g: G, dt: number, rt: number) {
        this.time += rt;
        this.ter = terrain(g);
        this.yelpT -= rt;
        this.thudT -= rt;
        this.arrowT -= rt;
        if (this.hold > 0) this.hold -= rt;
        // Etter en seier har eleven alt sett seiersposen mens belønningen sto: rett til planleggingen.
        if (g.phase === 'plan' && this.winSide === 0) this.hold = 0;
        if (g.phase !== this.phase) {
            if (g.phase === 'slag') {
                this.firstBig = false;
                this.raged = false;
                this.winSide = -1;
            }
            this.phase = g.phase;
        }
        let w = 0;
        for (const im of this.impulses) if (this.time - im.t < 0.5) this.impulses[w++] = im;
        this.impulses.length = w;

        const targets = this.targets(g);
        this.seen++;
        for (const t of targets) {
            let q = this.sqs.get(t.key);
            if (!q) {
                q = this.makeSquad(t);
                this.sqs.set(t.key, q);
            }
            this.syncSquad(q, t, g, dt);
            q.seen = this.seen;
        }
        for (const [k, q] of this.sqs) {
            if (q.seen === this.seen) continue;
            this.releaseSquad(q);
            this.sqs.delete(k);
        }
        const victory = g.phase === 'belonning' || (g.phase === 'slutt' && g.ended === 'vunnet') ? 0 : this.hold > 0 ? this.winSide : -1;
        const planning = g.phase === 'plan' && this.hold <= 0;
        for (const f of this.figs) if (f.on) this.stepFig(f, dt, victory, planning);
        this.stepArrows(dt);
        this.stepPts(dt);
        for (const s of this.splats) {
            if (!s.on) continue;
            s.age += dt;
            if (s.grow < 1) s.grow = Math.min(1, s.grow + dt * 6);
            if (planning) s.fade += rt * 0.35;
            if (s.fade >= 1) s.on = false;
        }
    }

    private targets(g: G): Target[] {
        const out: Target[] = [];
        if (this.hold > 0 && g.phase === 'plan') return this.frozen;
        if (g.phase === 'slag' || ((g.phase === 'belonning' || g.phase === 'slutt') && g.squads.length)) {
            for (const s of g.squads) {
                const d = UNITS[s.kind];
                out.push({
                    key: keyOfSquad(s.side, s.kind, s.row, s.col, s.uid),
                    side: s.side,
                    kind: s.kind,
                    star: s.star,
                    x: s.x,
                    z: s.z,
                    fx: s.fx,
                    fz: s.fz,
                    frac: s.max > 0 ? s.hp / s.max : 0,
                    dead: s.dead,
                    fled: s.fled,
                    engaged: s.engaged >= 0 || (d.klasse === 'skytter' && s.moving === 0 && g.phase === 'slag'),
                    moving: s.moving > 0,
                    panic: s.panic > 0,
                    buff: s.buffT > 0 ? s.buffKind : '',
                    rampage: s.rampage,
                    id: s.id,
                });
            }
            return out;
        }
        for (let r = 0; r < 2; r++)
            for (let c = 0; c < COLS; c++) {
                const u = g.board[r][c];
                if (u)
                    out.push(planTarget('p' + u.uid, 0, u.kind, u.star, COL_X[c], ROW_Z[r]));
                const e = g.enemy[r]?.[c];
                if (e) out.push(planTarget(keyOfSquad(1, e.kind, r, c, 0), 1, e.kind, e.star, COL_X[c], -ROW_Z[r]));
            }
        if (g.enemyCommander) out.push(planTarget('c' + g.enemyCommander, 1, g.enemyCommander, 1, 0, 10));
        return out;
    }

    private makeSquad(t: Target): VSq {
        const d = UNITS[t.kind];
        return {
            key: t.key,
            side: t.side,
            kind: t.kind,
            star: t.star,
            look: LOOK[t.kind],
            klasse: d.klasse,
            hero: !!d.hero,
            x: t.x,
            z: t.z,
            fx: t.fx,
            fz: t.fz,
            frac: 1,
            figs: [],
            seen: 0,
            engaged: false,
            moving: false,
            panic: false,
            fled: false,
            dead: false,
            buff: '',
            rampage: false,
            grow: 0,
            hitDx: 0,
            hitDz: t.side === 0 ? -1 : 1,
            dustT: 0,
            id: t.id,
        };
    }

    private syncSquad(q: VSq, t: Target, g: G, dt: number) {
        const jump = Math.hypot(t.x - q.x, t.z - q.z);
        const teleport = jump > 5 && g.phase === 'slag';
        if (t.star !== q.star) {
            q.star = t.star;
            q.grow = 1;
            // Omplasser alle figurene i den nye, større formasjonen.
            this.relayout(q);
        }
        q.x = t.x;
        q.z = t.z;
        q.fx = t.fx;
        q.fz = t.fz;
        q.frac = t.frac;
        q.engaged = t.engaged;
        q.moving = t.moving;
        q.panic = t.panic;
        q.buff = t.buff;
        q.rampage = t.rampage;
        q.id = t.id;
        if (q.grow > 0) q.grow = Math.max(0, q.grow - dt * 1.4);
        if (t.fled && !q.fled) {
            q.fled = true;
            for (const f of q.figs) {
                f.st = St.Exit;
                f.sq = null;
            }
            q.figs.length = 0;
            this.dust(q.x, q.z, 8, 1.4);
        }
        if (t.dead && !q.dead) {
            q.dead = true;
            for (const f of [...q.figs]) this.kill(q, f, true);
        }
        if (q.dead || q.fled) return;
        const n = this.countFor(q);
        const want = Math.max(1, Math.ceil(n * Math.max(0, Math.min(1, t.frac)) - 1e-6));
        while (q.figs.length > want) {
            // Den som står nærmest fienden, faller først.
            let pick = q.figs[0];
            let best = -Infinity;
            for (const f of q.figs) {
                if (f.lead) continue;
                const s = f.lz + Math.random() * 0.4;
                if (s > best) {
                    best = s;
                    pick = f;
                }
            }
            this.kill(q, pick, false);
        }
        if (q.figs.length < want) {
            this.spawn(q, want - q.figs.length, g.phase === 'plan' && q.grow <= 0);
            this.relayout(q);
        }
        if (teleport) {
            for (const f of q.figs) {
                f.x = q.x + (f.x - q.x) * 0.2 + rand(-0.5, 0.5);
                f.z = q.z + rand(-0.5, 0.5);
            }
            this.dust(q.x, q.z, 10, 1.6);
        }
        // Ryttere, vogner og elefanter i fart virvler opp støv.
        if (q.moving && q.klasse !== 'tung' && q.klasse !== 'skytter' && q.klasse !== 'lett') {
            q.dustT -= dt;
            if (q.dustT <= 0) {
                q.dustT = q.buff === 'kile' ? 0.05 : 0.14;
                const f = q.figs[Math.floor(Math.random() * q.figs.length)];
                if (f) this.dust(f.x - q.fx * 0.5, f.z - q.fz * 0.5, 1, q.klasse === 'elefant' ? 1.3 : 0.8);
            }
        }
    }

    private countFor(q: VSq) {
        return q.look.n[Math.max(0, Math.min(2, q.star - 1))];
    }

    private relayout(q: VSq) {
        const n = this.countFor(q);
        const cols = Math.min(q.look.cols, n);
        const rows = Math.ceil(n / cols);
        const sp = q.look.sp * 1.12 * (1 + 0.1 * (q.star - 1));
        for (let i = 0; i < q.figs.length; i++) this.slot(q.figs[i], i, cols, rows, sp, q);
    }

    private slot(f: Fig, i: number, cols: number, rows: number, sp: number, q: VSq) {
        const look = q.look;
        const col = i % cols;
        const row = Math.floor(i / cols);
        f.row = row;
        f.lx = (col - (cols - 1) / 2) * sp + (row % 2 && look.loose ? sp * 0.3 : 0) + (look.loose ? rand(-0.08, 0.08) : 0);
        f.lz = ((rows - 1) / 2 - row) * sp * (look.fig === 'kav' ? 1.25 : 0.95) + (look.loose ? rand(-0.08, 0.08) : 0);
        if (q.hero) {
            if (i === 0) {
                f.lx = 0;
                f.lz = sp * 0.55;
            } else {
                f.lx = (i % 2 ? -1 : 1) * sp * 0.75;
                f.lz = -sp * 0.35 - Math.floor((i - 1) / 2) * sp * 0.8;
            }
        }
        f.scale = FIG * (1 + 0.12 * (q.star - 1)) * (f.lead ? 1.3 : 1);
    }

    private freeFig(): Fig | null {
        for (const f of this.figs) if (!f.on) return f;
        // Fullt: gjenbruk det eldste liket.
        let old: Fig | null = null;
        for (const f of this.figs) if (f.st === St.Corpse && (!old || f.age > old.age)) old = f;
        return old;
    }

    private spawn(q: VSq, k: number, march: boolean) {
        const n = this.countFor(q);
        const cols = Math.min(q.look.cols, n);
        const rows = Math.ceil(n / cols);
        const sp = q.look.sp * 1.12 * (1 + 0.1 * (q.star - 1));
        for (let j = 0; j < k; j++) {
            const f = this.freeFig();
            if (!f) return;
            const i = q.figs.length;
            f.on = true;
            f.sq = q;
            f.type = q.look.fig;
            f.kind = q.kind;
            f.side = q.side;
            f.lead = q.hero && i === 0;
            f.st = St.Form;
            f.age = 0;
            f.t = 0;
            f.pitch = 0;
            f.roll = 0;
            f.vx = f.vy = f.vz = 0;
            f.bounced = false;
            f.ph = Math.random() * 10;
            this.slot(f, i, cols, rows, sp, q);
            const yaw = Math.atan2(q.fx, q.fz);
            const rx = q.fz;
            const rz = -q.fx;
            const wx = q.x + rx * f.lx + q.fx * f.lz;
            const wz = q.z + rz * f.lx + q.fz * f.lz;
            if (march) {
                // Marsjerer inn fra sin egen kant av sletta.
                f.x = wx;
                f.z = (q.side === 0 ? -17 : 17) + (q.side === 0 ? -1 : 1) * (f.row * 0.7 + rand(0, 0.6));
                f.delay = rand(0, 0.25) + f.row * 0.08;
                f.pop = 1;
                f.yaw = q.side === 0 ? 0 : Math.PI;
            } else {
                f.x = wx;
                f.z = wz;
                f.delay = 0;
                f.pop = 0;
                f.yaw = yaw;
            }
            f.y = groundY(this.ter, f.x, f.z);
            f.spear = -1.3;
            f.moving = 0;
            this.colorFig(f, q);
            q.figs.push(f);
        }
    }

    private colorFig(f: Fig, q: VSq) {
        const hc = HERO_CLOTH[q.kind];
        f.cloth.set(hc && (f.lead || q.look.n[0] === 1) ? hc : CLOTH[q.side][q.klasse]);
        // Litt variasjon i stoffet, som i en ekte hær.
        f.cloth.offsetHSL(0, 0, rand(-0.035, 0.035));
        f.helm.set(q.look.helm);
        if (f.lead && q.kind === 'aleksander') f.coat.set('#f4ecd8');
        else if (f.lead) f.coat.set('#efe3c8');
        else f.coat.set(COATS[Math.floor(Math.random() * COATS.length)]);
    }

    private releaseSquad(q: VSq) {
        const suck = this.mergeAt && this.time - this.mergeAt.t < 0.6 && q.side === 0;
        for (const f of q.figs) {
            f.sq = null;
            if (suck && this.mergeAt) {
                f.st = St.Suck;
                f.t = 0;
                f.tx = this.mergeAt.x;
                f.tz = this.mergeAt.z;
                f.vx = f.x;
                f.vz = f.z;
            } else f.st = St.Exit;
        }
        q.figs.length = 0;
    }

    /** En soldat faller: han flyr i en bue bort fra den som slo, og blir liggende. */
    private kill(q: VSq, f: Fig, all: boolean) {
        const i = q.figs.indexOf(f);
        if (i >= 0) q.figs.splice(i, 1);
        f.sq = null;
        // Retning: bort fra nærmeste fiende (eller dit dødsstøtet kom fra).
        let dx = q.hitDx;
        let dz = q.hitDz;
        let best = Infinity;
        for (const o of this.sqs.values()) {
            if (o.side === q.side || o.dead || o.fled) continue;
            const d = Math.hypot(o.x - f.x, o.z - f.z);
            if (d < best) {
                best = d;
                dx = (f.x - o.x) / (d || 1);
                dz = (f.z - o.z) / (d || 1);
            }
        }
        let pow = 1;
        for (const im of this.impulses) {
            const d = Math.hypot(im.x - f.x, im.z - f.z);
            if (d < 3.2) pow = Math.max(pow, 1 + im.pow * (1 - d / 3.2) * 1.6);
        }
        if (all) pow = Math.max(pow, 1.3);
        this.launch(f, dx, dz, pow, St.Fly);
        this.blood(f.x, f.y + 0.6, f.z, dx, dz, 4 + Math.round(pow * 2));
        if (this.yelpT <= 0 && this.sound) {
            this.sound.yelp(pow > 1.6);
            this.yelpT = 0.09;
        }
    }

    private launch(f: Fig, dx: number, dz: number, pow: number, st: St) {
        const heavy = f.type === 'ele' ? 0.15 : f.type === 'vogn' ? 0.45 : f.type === 'kav' ? 0.7 : 1;
        const sp = rand(2.2, 4) * pow * heavy;
        const sx = rand(-0.5, 0.5);
        f.vx = (dx + sx * dz) * sp;
        f.vz = (dz - sx * dx) * sp;
        f.vy = rand(4.5, 7) * Math.min(2.2, pow) * (0.4 + 0.6 * heavy);
        f.wp = rand(-9, 9) * heavy;
        f.wr = rand(-9, 9) * heavy;
        if (f.type === 'ele') {
            f.vy = 1.2;
            f.wp = 0;
            f.wr = rand(0.5, 1) * 2.4 * (Math.random() < 0.5 ? -1 : 1);
        }
        f.st = st;
        f.t = 0;
        f.bounced = false;
        f.lie = Math.random() < 0.5 ? 1 : -1;
    }

    // -----------------------------------------------------------------------
    // Hendelser fra spillreglene
    // -----------------------------------------------------------------------

    private onEvent(g: G, e: GameEvent) {
        const ps = this.particleScale;
        switch (e.type) {
            case 'stot': {
                const pow = e.big ? 1 : 0.45;
                this.impulses.push({ x: e.x, z: e.z, t: this.time, pow });
                this.dust(e.x, e.z, Math.round((e.big ? 12 : 5) * Math.max(0.5, ps)), e.big ? 1.8 : 1.1);
                if (e.big) this.smoke(e.x, e.z, 4);
                this.sparks(e.x, 0.8, e.z, e.big ? 10 : 4);
                // Bølgen: de som står rundt treffpunktet, blir slått over ende.
                const victims = e.bounce ? e.side : ((1 - e.side) as 0 | 1);
                this.knock(e.x, e.z, victims, e.big ? 2.8 : 1.8, e.big ? 6 : 2, e.big ? 1.5 : 1);
                if (e.big && !this.firstBig && g.phase === 'slag') {
                    this.firstBig = true;
                    this.offer({ kind: 'bolge', x: e.x, z: e.z, pri: 1 });
                }
                if (e.big) this.sound?.boom();
                break;
            }
            case 'dod': {
                const q = this.sqs.get(this.keyOf(g, e.id));
                if (q) {
                    q.hitDx = e.dx;
                    q.hitDz = e.dz;
                }
                break;
            }
            case 'skudd': {
                const a = this.sqs.get(this.keyOf(g, e.from));
                const b = this.sqs.get(this.keyOf(g, e.to));
                if (a && b) {
                    this.volley(a, b, e.kind);
                    // Det parthiske skuddet: tre ganger så tette salver over skulderen.
                    if ((this.parth.get(a.key) ?? 0) > this.time) {
                        this.volley(a, b, e.kind);
                        this.volley(a, b, e.kind);
                    }
                }
                break;
            }
            case 'parthisk': {
                const a = this.sqs.get(this.keyOf(g, e.id));
                if (!a) break;
                this.parth.set(a.key, this.time + 4);
                // Snu i salen og slipp en sky av piler mot de nærmeste fiendene.
                const foes = [...this.sqs.values()]
                    .filter((q) => q.side !== a.side && !q.dead && !q.fled)
                    .sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))
                    .slice(0, 3);
                for (const b of foes) {
                    this.volley(a, b, a.kind);
                    this.volley(a, b, a.kind);
                }
                this.flash(a.x, 1.2, a.z, 3, PAL.gul);
                this.dust(a.x, a.z, Math.round(10 * Math.max(0.5, ps)), 1.6);
                this.offer({ kind: 'parthisk', x: a.x, z: a.z, pri: 2 });
                break;
            }
            case 'evne': {
                this.flash(e.x, 1, e.z, 3.5, PAL.gul);
                this.ring(e.x, e.z, 2.4, PAL.gul, 14);
                if (g.leader === 'aleksander' && terrain(g) === 'hoyde') this.offer({ kind: 'sti', x: 0, z: 11, pri: 2 });
                break;
            }
            case 'kile-treff': {
                this.impulses.push({ x: e.x, z: e.z, t: this.time, pow: 2.2 });
                this.flash(e.x, 1, e.z, 5, PAL.gul);
                this.dust(e.x, e.z, Math.round(22 * Math.max(0.5, ps)), 2.4);
                this.smoke(e.x, e.z, 8);
                this.sparks(e.x, 1, e.z, 18);
                this.knock(e.x, e.z, 1, 3.6, 12, 2.4);
                this.offer({ kind: 'kile', x: e.x, z: e.z, pri: 3 });
                this.sound?.boom();
                break;
            }
            case 'storkonge-flykter':
                this.dust(e.x, e.z, 14, 2);
                this.offer({ kind: 'storkonge', x: e.x, z: e.z, pri: 3 });
                break;
            case 'elefant-raser':
                this.dust(e.x, e.z, 12, 2);
                this.knock(e.x, e.z, 0, 2.6, 5, 1.6);
                this.knock(e.x, e.z, 1, 2.6, 5, 1.6);
                if (!this.raged) {
                    this.raged = true;
                    this.offer({ kind: 'elefant', x: e.x, z: e.z, pri: 2 });
                }
                break;
            case 'slag-slutt': {
                this.winSide = e.won ? 0 : 1;
                this.hold = 0;
                this.frozen = this.targets(g).map((t) => ({ ...t, moving: false, engaged: false }));
                this.hold = 2.2;
                // Gull som spretter opp fra dem som står igjen.
                if (e.won) {
                    let n = 0;
                    for (const q of this.sqs.values()) {
                        if (q.side !== 0 || q.dead || q.fled) continue;
                        for (const f of q.figs) if (n++ < 60) this.coin(f.x, f.y + 1, f.z);
                    }
                    this.sound?.coin();
                }
                break;
            }
            case 'smelt': {
                if (e.loc.at !== 'board') break;
                const x = COL_X[e.loc.col];
                const z = ROW_Z[e.loc.row];
                this.mergeAt = { x, z, t: this.time };
                this.flash(x, 1.2, z, 6, '#fff2c8');
                this.flash(x, 0.6, z, 3.5, PAL.gul);
                this.pillar(x, z);
                this.ring(x, z, 3.2, PAL.gul, 22);
                this.dustRing(x, z);
                this.sparks(x, 1, z, 26);
                this.offer({ kind: 'smelt', x, z, pri: 1 });
                this.sound?.boom();
                break;
            }
            default:
                break;
        }
    }

    private offer(m: Moment) {
        if (!this.moment || m.pri >= this.moment.pri) this.moment = m;
    }

    /** Slå levende soldater over ende rundt et punkt (de reiser seg igjen). */
    private knock(x: number, z: number, side: 0 | 1, r: number, max: number, pow: number) {
        let n = 0;
        for (const f of this.figs) {
            if (!f.on || f.st !== St.Form || f.side !== side || f.lead || f.type === 'ele') continue;
            const d = Math.hypot(f.x - x, f.z - z);
            if (d > r || Math.random() > 0.75) continue;
            const dx = (f.x - x) / (d || 1);
            const dz = (f.z - z) / (d || 1);
            this.launch(f, dx, dz, pow * (1 - d / (r * 1.4)), St.Tumble);
            f.delay = d * 0.06; // bølgen brer seg utover
            this.blood(f.x, f.y + 0.6, f.z, dx, dz, 2);
            if (++n >= max) break;
        }
    }

    private volley(a: VSq, b: VSq, kind: Kind) {
        const look = LOOK[kind];
        const javelin = !look.bow && !look.sling;
        const n = Math.max(2, Math.round((look.bow ? 7 : look.sling ? 5 : 4) * Math.max(0.55, this.particleScale)));
        for (let i = 0; i < n; i++) {
            const src = a.figs[Math.floor(Math.random() * a.figs.length)];
            if (!src) return;
            const tx = b.x + rand(-1, 1);
            const tz = b.z + rand(-1, 1);
            const sy = src.y + (src.type === 'kav' ? 1.2 : 0.75);
            const ty = groundY(this.ter, tx, tz) + 0.2;
            const dist = Math.hypot(tx - src.x, tz - src.z);
            const T = 0.45 + dist * 0.045;
            const g = look.sling ? GRAV : 14;
            const vy = (ty - sy + 0.5 * g * T * T) / T;
            if (look.sling) {
                const p = this.pt(this.hard);
                if (!p) continue;
                this.setPt(p, src.x, sy, src.z, (tx - src.x) / T, vy, (tz - src.z) / T, T + 0.3, 0.09, 0.09, '#3a2a1e', 1, g, 0, 0, false);
                continue;
            }
            const ar = this.arrows[this.arrowI];
            this.arrowI = (this.arrowI + 1) % MAX_ARROW;
            ar.on = true;
            ar.stuck = false;
            ar.x = src.x;
            ar.y = sy;
            ar.z = src.z;
            ar.vx = (tx - src.x) / T;
            ar.vz = (tz - src.z) / T;
            ar.vy = vy;
            ar.life = 7;
            ar.len = javelin ? 1.9 : 1;
            ar.delay = i * 0.03;
        }
        if (this.arrowT <= 0 && this.sound) {
            this.sound.arrows();
            this.arrowT = 0.18;
        }
    }

    // -----------------------------------------------------------------------
    // Partikler
    // -----------------------------------------------------------------------

    private pt(pool: Pt[]): Pt | null {
        for (const p of pool) if (!p.on) return p;
        // Fullt: ta den eldste.
        let old: Pt | null = null;
        for (const p of pool) if (!old || p.age / p.life > old.age / old.life) old = p;
        return old;
    }

    private setPt(
        p: Pt,
        x: number,
        y: number,
        z: number,
        vx: number,
        vy: number,
        vz: number,
        life: number,
        s0: number,
        s1: number,
        col: string,
        a0: number,
        grav: number,
        drag: number,
        bounce: number,
        splat: boolean
    ) {
        p.on = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = vx;
        p.vy = vy;
        p.vz = vz;
        p.age = 0;
        p.life = life;
        p.s0 = s0;
        p.s1 = s1;
        p.col.set(col);
        p.a0 = a0;
        p.grav = grav;
        p.drag = drag;
        p.bounce = bounce;
        p.splat = splat;
    }

    dust(x: number, z: number, n: number, size: number) {
        const k = Math.max(1, Math.round(n * Math.max(0.5, this.particleScale)));
        const y = groundY(this.ter, x, z);
        for (let i = 0; i < k; i++) {
            const p = this.pt(this.soft);
            if (!p) return;
            const a = Math.random() * Math.PI * 2;
            const s = rand(0.4, 1.6) * size;
            const tone = Math.random() < 0.5 ? '#e2c894' : '#cdb07a';
            this.setPt(p, x + Math.cos(a) * 0.4, y + 0.3, z + Math.sin(a) * 0.4, Math.cos(a) * s, rand(0.3, 1.4), Math.sin(a) * s, rand(1.2, 2.4), 0.5 * size, 1.9 * size, tone, 0.75, -0.2, 1.8, 0, false);
        }
    }

    /** Mørk røyk som stiger sakte etter de store støtene. */
    private smoke(x: number, z: number, n: number) {
        const y = groundY(this.ter, x, z) + 0.6;
        const k = Math.max(2, Math.round(n * Math.max(0.5, this.particleScale)));
        for (let i = 0; i < k; i++) {
            const p = this.pt(this.soft);
            if (!p) return;
            this.setPt(p, x + rand(-0.8, 0.8), y, z + rand(-0.8, 0.8), rand(-0.4, 0.4), rand(0.8, 1.6), rand(-0.4, 0.4), rand(2.2, 3.4), 0.8, 2.6, i % 2 ? '#7a6a58' : '#8f7f6a', 0.55, -0.1, 0.6, 0, false);
        }
    }

    private sparks(x: number, y: number, z: number, n: number) {
        const k = Math.max(2, Math.round(n * Math.max(0.5, this.particleScale)));
        for (let i = 0; i < k; i++) {
            const p = this.pt(this.glow);
            if (!p) return;
            const a = Math.random() * Math.PI * 2;
            const s = rand(2, 6);
            this.setPt(p, x, y + rand(0, 0.5), z, Math.cos(a) * s, rand(2, 6), Math.sin(a) * s, rand(0.25, 0.5), 0.14, 0.02, '#ffd98a', 1, 14, 0.5, 0, false);
        }
    }

    private flash(x: number, y: number, z: number, size: number, col: string) {
        const p = this.pt(this.glow);
        if (!p) return;
        this.setPt(p, x, y, z, 0, 0.3, 0, 0.55, size * 0.35, size, col, 1, 0, 0, 0, false);
    }

    /** Lyssøyle som skyter opp der tre ble til én. */
    private pillar(x: number, z: number) {
        const y0 = groundY(this.ter, x, z);
        for (let i = 0; i < 12; i++) {
            const p = this.pt(this.glow);
            if (!p) return;
            this.setPt(p, x + rand(-0.15, 0.15), y0 + 0.4 + i * 0.7, z + rand(-0.15, 0.15), 0, 2 + i * 0.6, 0, 0.7 + i * 0.03, 1.6 - i * 0.05, 0.4, i % 2 ? '#fff4d0' : '#ffd27a', 1, 0, 0.5, 0, false);
        }
    }

    private dustRing(x: number, z: number) {
        const y = groundY(this.ter, x, z) + 0.2;
        const n = Math.max(8, Math.round(16 * this.particleScale));
        for (let i = 0; i < n; i++) {
            const p = this.pt(this.soft);
            if (!p) return;
            const a = (i / n) * Math.PI * 2;
            this.setPt(p, x, y, z, Math.cos(a) * 6, 0.6, Math.sin(a) * 6, 0.9, 0.5, 1.6, '#f2dca8', 0.9, 0, 3.5, 0, false);
        }
    }

    private ring(x: number, z: number, r: number, col: string, n: number) {
        const y = groundY(this.ter, x, z) + 0.3;
        for (let i = 0; i < n; i++) {
            const p = this.pt(this.glow);
            if (!p) return;
            const a = (i / n) * Math.PI * 2;
            this.setPt(p, x + Math.cos(a) * 0.3, y, z + Math.sin(a) * 0.3, Math.cos(a) * r * 2.4, 0.4, Math.sin(a) * r * 2.4, 0.5, 0.45, 0.1, col, 1, 0, 3, 0, false);
        }
    }

    private blood(x: number, y: number, z: number, dx: number, dz: number, n: number) {
        const k = Math.max(1, Math.round(n * Math.max(0.6, this.particleScale)));
        for (let i = 0; i < k; i++) {
            const p = this.pt(this.hard);
            if (!p) return;
            const s = rand(1, 3.5);
            this.setPt(p, x, y, z, dx * s + rand(-1.2, 1.2), rand(2, 5.5), dz * s + rand(-1.2, 1.2), 1.4, rand(0.07, 0.13), 0.06, i % 3 ? PAL.blod : '#b0261a', 1, GRAV, 0.2, 0, i === 0 && Math.random() < 0.4);
        }
    }

    private coin(x: number, y: number, z: number) {
        const p = this.pt(this.hard);
        if (!p) return;
        this.setPt(p, x, y, z, rand(-1.8, 1.8), rand(6, 10), rand(-1.8, 1.8), 2.8, 0.26, 0.26, Math.random() < 0.3 ? '#fff0b0' : '#f0c24e', 1, GRAV, 0.2, 3, false);
    }

    private addSplat(x: number, z: number, s: number) {
        const sp = this.splats[this.splatI];
        this.splatI = (this.splatI + 1) % MAX_SPLAT;
        sp.on = true;
        sp.x = x;
        sp.z = z;
        sp.y = groundY(this.ter, x, z) + 0.025 + Math.random() * 0.01;
        sp.s = s;
        sp.rot = Math.random() * Math.PI * 2;
        sp.age = 0;
        sp.grow = 0;
        sp.fade = 0;
    }

    private stepPts(dt: number) {
        for (const pool of [this.soft, this.hard, this.glow])
            for (const p of pool) {
                if (!p.on) continue;
                p.age += dt;
                if (p.age >= p.life) {
                    p.on = false;
                    continue;
                }
                const dr = Math.exp(-p.drag * dt);
                p.vx *= dr;
                p.vz *= dr;
                p.vy = p.vy * dr - p.grav * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.z += p.vz * dt;
                if (p.grav > 0) {
                    const gy = groundY(this.ter, p.x, p.z) + p.s0 * 0.5;
                    if (p.y < gy) {
                        p.y = gy;
                        if (p.splat) {
                            this.addSplat(p.x, p.z, rand(0.25, 0.5));
                            p.splat = false;
                        }
                        if (p.bounce > 0) {
                            p.bounce--;
                            p.vy = Math.abs(p.vy) * 0.5;
                            p.vx *= 0.6;
                            p.vz *= 0.6;
                        } else {
                            p.vx = p.vz = p.vy = 0;
                            p.grav = 0;
                            if (p.life - p.age > 0.5) p.life = p.age + 0.5;
                        }
                    }
                }
            }
    }

    private stepArrows(dt: number) {
        for (const a of this.arrows) {
            if (!a.on) continue;
            if (a.delay > 0) {
                a.delay -= dt;
                continue;
            }
            if (a.stuck) {
                a.life -= dt;
                if (a.life <= 0) a.on = false;
                continue;
            }
            a.vy -= 14 * dt;
            a.x += a.vx * dt;
            a.y += a.vy * dt;
            a.z += a.vz * dt;
            a.yaw = Math.atan2(a.vx, a.vz);
            a.pitch = -Math.atan2(a.vy, Math.hypot(a.vx, a.vz));
            const gy = groundY(this.ter, a.x, a.z);
            if (a.y < gy + 0.12) {
                a.stuck = true;
                a.y = gy + 0.12;
                if (Math.random() < 0.25) this.dust(a.x, a.z, 1, 0.35);
                if (this.thudT <= 0 && this.sound) {
                    this.sound.thud();
                    this.thudT = 0.12;
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // Figurene
    // -----------------------------------------------------------------------

    private stepFig(f: Fig, dt: number, victory: number, planning: boolean) {
        f.age += dt;
        const ter = this.ter;
        if (f.pop < 1) f.pop = Math.min(1, f.pop + dt * 3);
        switch (f.st) {
            case St.Form: {
                const q = f.sq;
                if (!q) {
                    f.st = St.Exit;
                    return;
                }
                if (f.delay > 0) {
                    f.delay -= dt;
                    return;
                }
                const rx = q.fz;
                const rz = -q.fx;
                let wx = q.x + rx * f.lx + q.fx * f.lz;
                let wz = q.z + rz * f.lx + q.fz * f.lz;
                if (q.panic) {
                    wx += Math.sin(this.time * 7 + f.ph * 3) * 0.35;
                    wz += Math.cos(this.time * 6 + f.ph * 2) * 0.35;
                }
                const dx = wx - f.x;
                const dz = wz - f.z;
                const d = Math.hypot(dx, dz);
                const speed = planning ? 5.5 : Math.max(3.5, d * 4);
                const step = Math.min(d, speed * dt);
                if (d > 0.001) {
                    f.x += (dx / d) * step;
                    f.z += (dz / d) * step;
                }
                const mv = d > 0.12 || (q.moving && !planning) ? 1 : 0;
                f.moving += (mv - f.moving) * Math.min(1, dt * 8);
                // Ser dit den går når den har langt å gå, ellers dit enheten ser.
                const want = d > 0.6 ? Math.atan2(dx, dz) : Math.atan2(q.fx, q.fz);
                f.yaw = turn(f.yaw, want, dt * 7);
                f.t += dt;
                const tt = this.time * (f.type === 'kav' ? 9 : 11) + f.ph;
                let y = groundY(ter, f.x, f.z);
                if (ter === 'elv' && Math.abs(f.z) < 1.3) y = Math.max(y, -0.08);
                f.pitch = 0;
                f.roll = 0;
                if (f.type === 'kav') {
                    y += Math.abs(Math.sin(tt)) * 0.14 * f.moving;
                    f.pitch = Math.sin(tt * 2) * 0.1 * f.moving;
                } else if (f.type === 'ele') {
                    y += Math.abs(Math.sin(tt * 0.45)) * 0.06 * f.moving;
                    f.roll = Math.sin(tt * 0.45) * 0.05 * (f.moving + (q.rampage ? 1 : 0));
                    if (q.rampage) f.yaw += Math.sin(this.time * 9 + f.ph) * 0.05;
                } else if (f.type === 'inf') {
                    y += Math.abs(Math.sin(tt)) * 0.06 * f.moving;
                    f.pitch = 0.1 * f.moving;
                }
                // Nærkamp: fremste rekker stikker og hugger.
                let lunge = 0;
                if (q.engaged && !planning && victory < 0) {
                    const s = Math.sin(this.time * 8 + f.ph * 5);
                    lunge = Math.max(0, s) * (f.row === 0 ? 0.16 : 0.07);
                    if (f.type === 'inf') f.pitch += lunge * 0.8;
                }
                f.lun = lunge;
                // Seierspose: hopper og løfter spydet.
                if (victory === f.side) {
                    y += Math.abs(Math.sin(this.time * 7 + f.ph * 2)) * (f.type === 'inf' ? 0.38 : 0.18);
                    f.yaw += Math.sin(this.time * 3 + f.ph) * 0.02;
                }
                f.y = y;
                // Spydet: reist i ro, senket i marsj og kamp; bakre rekker skrått (sarissaskogen).
                let sp = -1.35;
                if (victory === f.side) sp = -1.52 + Math.sin(this.time * 7 + f.ph) * 0.15;
                else if ((q.engaged || q.moving || f.moving > 0.5) && !(planning && d < 0.12)) {
                    sp = f.row <= 1 ? 0.06 : f.row === 2 ? -0.45 : -0.85;
                    if (q.engaged) sp += Math.sin(this.time * 8 + f.ph * 5) * 0.08;
                }
                f.spear += (sp - f.spear) * Math.min(1, dt * 6);
                return;
            }
            case St.Fly:
            case St.Tumble: {
                f.lun = 0;
                if (f.delay > 0) {
                    f.delay -= dt;
                    return;
                }
                f.t += dt;
                f.vy -= GRAV * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.z += f.vz * dt;
                f.pitch += f.wp * dt;
                f.roll += f.wr * dt;
                const gy = groundY(ter, f.x, f.z);
                if (f.y <= gy && f.vy < 0) {
                    f.y = gy;
                    if (!f.bounced && f.vy < -4 && f.type !== 'ele') {
                        f.bounced = true;
                        f.vy = -f.vy * 0.28;
                        f.vx *= 0.45;
                        f.vz *= 0.45;
                        f.wp *= 0.4;
                        f.wr *= 0.4;
                        if (f.st === St.Fly) this.addSplat(f.x, f.z, rand(0.45, 0.8));
                        this.dust(f.x, f.z, 1, 0.5);
                    } else {
                        f.vx = f.vy = f.vz = 0;
                        f.t = 0;
                        if (f.st === St.Fly) {
                            f.st = St.Corpse;
                            f.age = 0;
                        } else f.st = St.Down;
                    }
                }
                return;
            }
            case St.Down: {
                // Ligger et øyeblikk, så reiser han seg og går tilbake i rekka.
                f.t += dt;
                const k = Math.min(1, dt * 5);
                f.pitch += (f.lie * 1.45 - f.pitch) * k;
                f.roll += (0 - f.roll) * k;
                if (f.t > 0.7) {
                    if (f.sq) {
                        f.st = St.Form;
                        f.pitch = 0;
                        f.roll = 0;
                    } else f.st = St.Exit;
                }
                return;
            }
            case St.Corpse: {
                const k = Math.min(1, dt * 6);
                const lie = f.type === 'kav' || f.type === 'ele' || f.type === 'vogn' ? 0 : f.lie * 1.5;
                const side = f.type === 'inf' ? f.roll * 0.3 : f.lie * 1.45;
                f.pitch += (lie - f.pitch) * k;
                f.roll += (side - f.roll) * k;
                f.y = groundY(ter, f.x, f.z) + (f.type === 'ele' ? 0.1 : 0.04);
                if (planning) {
                    f.t += dt;
                    if (f.t > 1.2) f.y -= (f.t - 1.2) * 0.8;
                    if (f.t > 2.6) f.on = false;
                }
                return;
            }
            case St.Exit: {
                const tz = f.side === 0 ? -19 : 19;
                const dz = tz - f.z;
                f.yaw = turn(f.yaw, dz > 0 ? 0 : Math.PI, dt * 6);
                f.z += Math.sign(dz) * 6 * dt;
                f.y = groundY(ter, f.x, f.z) + Math.abs(Math.sin(this.time * 12 + f.ph)) * 0.08;
                f.pitch = 0.15;
                f.roll = 0;
                if (Math.abs(dz) < 0.5) f.on = false;
                return;
            }
            case St.Suck: {
                // Trekkes inn i lyset der tre ble til én.
                f.t += dt;
                const u = Math.min(1, f.t / 0.55);
                const e = u * u;
                f.x = f.vx + (f.tx - f.vx) * e;
                f.z = f.vz + (f.tz - f.vz) * e;
                f.y = groundY(ter, f.x, f.z) + Math.sin(u * Math.PI) * 2.2;
                f.pitch += dt * 12;
                f.pop = 1 - u;
                if (u >= 1) f.on = false;
                return;
            }
        }
    }

    // -----------------------------------------------------------------------
    // Tegning: skriv instansene
    // -----------------------------------------------------------------------

    write() {
        const m = this.meshes;
        if (!m) return;
        const n: Record<string, number> = {};
        const put = (key: keyof ArmyMeshes, mat: THREE.Matrix4, col?: THREE.Color) => {
            const mesh = m[key];
            if (!mesh) return;
            const i = n[key] ?? 0;
            if (i >= mesh.instanceMatrix.count) return;
            mesh.setMatrixAt(i, mat);
            if (col && mesh.instanceColor) mesh.setColorAt(i, col);
            n[key] = i + 1;
        };
        const human = (base: THREE.Matrix4, f: Fig, look: Look, withShield: boolean, withSpear: boolean, withBow: boolean, crest: boolean) => {
            put('cloth', base, f.cloth);
            put('gear', base, WHITE);
            put('helm', base, f.helm);
            if (crest) {
                C.set(f.lead ? (f.kind === 'aleksander' ? '#f4ecd8' : PAL.gul) : f.side === 0 ? PAL.gul : PAL.kalk);
                put('crest', base, C);
            }
            if (withShield && look.shield > 0) {
                L.compose(P.set(-0.23, 0.5, 0.15), Q.setFromEuler(EX.set(0, -0.25, 0)), S.set(look.shield, look.shield, look.shield));
                M.multiplyMatrices(base, L);
                C.set(SHIELD_COL[f.side]);
                put('shield', M, C);
            }
            if (withSpear && look.spear > 0) {
                L.compose(P.set(0.21, 0.56, 0.06), Q.setFromEuler(EX.set(f.spear, 0, 0)), S.set(1, 1, look.spear));
                M.multiplyMatrices(base, L);
                put('spear', M, WHITE);
            }
            if (withBow && look.bow > 0) {
                M.multiplyMatrices(base, L_BOW);
                if (look.bow !== 1) M.scale(S.set(1, look.bow, 1));
                put('bow', M, WHITE);
            }
        };
        for (const f of this.figs) {
            if (!f.on) continue;
            const look = LOOK[f.kind];
            const sc = f.scale * (0.25 + 0.75 * f.pop) * (f.sq && f.sq.grow > 0 ? 1 + Math.sin(f.sq.grow * Math.PI) * 0.35 : 1);
            Q.setFromEuler(EY.set(f.pitch, f.yaw, f.roll));
            const lx = f.sq && f.lun ? f.sq.fx * f.lun : 0;
            const lz = f.sq && f.lun ? f.sq.fz * f.lun : 0;
            F.compose(P.set(f.x + lx, f.y, f.z + lz), Q, S.set(sc, sc, sc));
            const crest = !!look.crest || f.lead || (f.sq ? f.sq.star >= 3 : false);
            if (f.type === 'inf') human(F, f, look, true, true, true, crest);
            else if (f.type === 'kav') {
                put('horse', F, f.coat);
                B.multiplyMatrices(F, L_RIDER);
                human(B, f, look, false, true, true, crest);
            } else if (f.type === 'vogn') {
                C.set(f.kind === 'dareios' ? '#e8b64a' : f.side === 0 ? PAL.rod : PAL.gul);
                put('chariot', F, C);
                M.multiplyMatrices(F, L_HORSE_A);
                put('horse', M, f.coat);
                M.multiplyMatrices(F, L_HORSE_B);
                put('horse', M, f.coat);
                B.multiplyMatrices(F, L_DRIVER);
                human(B, f, look, false, false, false, f.kind === 'dareios');
            } else {
                put('elephant', F, WHITE);
                C.set(f.kind === 'poros' ? '#e8b64a' : CLOTH[f.side].elefant);
                put('tower', F, C);
                B.multiplyMatrices(F, L_MAHOUT);
                human(B, f, look, false, false, false, f.kind === 'poros');
                B.multiplyMatrices(F, L_ARCHER);
                human(B, f, LOOK.bue, false, false, true, false);
            }
            // Fane over hærførere og stjerne-enheter.
            if (f.st === St.Form && f.sq && (f.lead || (f.sq.star >= 2 && f.sq.figs[0] === f) || (f.kind === 'dareios' && f.sq.figs[0] === f))) {
                M.multiplyMatrices(F, L_STANDARD);
                C.set(f.side === 0 ? PAL.gul : f.kind === 'dareios' ? '#f0c24e' : PAL.kalk);
                put('standard', M, C);
            }
            if (m.blob && f.st !== St.Fly && f.st !== St.Suck) {
                const w = f.type === 'ele' ? 1.6 : f.type === 'vogn' ? 1.3 : f.type === 'kav' ? 0.8 : 0.45;
                const lz = f.type === 'ele' ? 2 : f.type === 'vogn' || f.type === 'kav' ? 1.6 : 1.1;
                const gy = groundY(this.ter, f.x, f.z) + 0.02;
                M.compose(P.set(f.x, gy, f.z + lz * 0.3), Q.identity(), S.set(w * sc, 1, lz * sc));
                put('blob', M);
            }
        }
        // Piler
        for (const a of this.arrows) {
            if (!a.on || a.delay > 0) continue;
            Q.setFromEuler(EY.set(a.pitch, a.yaw, 0));
            M.compose(P.set(a.x, a.y, a.z), Q, S.set(1, 1, a.len));
            put('arrow', M);
        }
        // Blodflekker
        for (const s of this.splats) {
            if (!s.on) continue;
            const k = s.s * s.grow * (1 - s.fade);
            Q.setFromAxisAngle(P.set(0, 1, 0), s.rot);
            M.compose(P.set(s.x, s.y, s.z), Q, S.set(k, 1, k));
            put('splat', M);
        }
        // Partikler (billboards: skalaen er størrelsen, fargen og alfa i egne attributter)
        const pts = (key: 'soft' | 'hard' | 'glow', pool: Pt[]) => {
            const mesh = m[key];
            const col = mesh.geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute;
            const al = mesh.geometry.getAttribute('aAlpha') as THREE.InstancedBufferAttribute;
            let i = 0;
            for (const p of pool) {
                if (!p.on) continue;
                const u = p.age / p.life;
                const s = p.s0 + (p.s1 - p.s0) * u;
                M.makeScale(s, s, s);
                M.setPosition(p.x, p.y, p.z);
                mesh.setMatrixAt(i, M);
                col.setXYZ(i, p.col.r, p.col.g, p.col.b);
                const a = key === 'hard' ? (u > 0.8 ? (1 - u) * 5 : 1) : Math.sin(Math.min(1, u * 1.3) * Math.PI) * (1 - u * 0.4);
                al.setX(i, a * p.a0);
                i++;
            }
            mesh.count = i;
            mesh.boundingBox = null;
            mesh.instanceMatrix.needsUpdate = true;
            col.needsUpdate = true;
            al.needsUpdate = true;
        };
        pts('soft', this.soft);
        pts('hard', this.hard);
        pts('glow', this.glow);
        for (const key of Object.keys(m) as (keyof ArmyMeshes)[]) {
            if (key === 'soft' || key === 'hard' || key === 'glow') continue;
            const mesh = m[key];
            if (!mesh) continue;
            mesh.count = n[key] ?? 0;
            // Scene-revisjonen regner ut boksen på nytt når den spør; kulling er av.
            mesh.boundingBox = null;
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
    }
}

function turn(a: number, b: number, k: number) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * Math.min(1, k);
}

function keyOfSquad(side: 0 | 1, kind: Kind, row: number, col: number, uid: number) {
    if (side === 0) return 'p' + uid;
    if (UNITS[kind].hero) return 'c' + kind;
    return `e${row}${col}${kind}`;
}

function planTarget(key: string, side: 0 | 1, kind: Kind, star: number, x: number, z: number): Target {
    return {
        key,
        side,
        kind,
        star,
        x,
        z,
        fx: 0,
        fz: side === 0 ? 1 : -1,
        frac: 1,
        dead: false,
        fled: false,
        engaged: false,
        moving: false,
        panic: false,
        buff: '',
        rampage: false,
        id: -1,
    };
}
