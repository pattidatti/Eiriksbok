// Spillreglene for «Frisk puss!»: ren, deterministisk simulering uten three.js.
//
// Fast tidssteg (1/120 s). Figuren er en boks (0,6 m bred, 1,7 m høy) som flyttes akse for
// akse mot kolliderboksene i banen (level.ts), så den aldri går gjennom en vegg og aldri henger
// fast stille i et hjørne. Input er et lite objekt: retning (x/z relativt til kameraets vinkel),
// hopp holdt + antall hopp-trykk, og kameravinkelen.
//
// Tre regler bærer spillet: (1) bjelkene i veggen bærer, løse planker og Bramantes tau-stillas
// gjør det ikke uten riktig timing; (2) pussen tørker; (3) søler du bøtta, er du tilbake ved
// sjekkpunktet.
//
// Hindrene: løse planker, tau-stillas, svingende talje, talje-heis (snarvei), trekk fra
// vinduene, tørr puss som løsner i kjede og våt, glatt puss. Utfordringene: uten sjekkpunkter,
// speilvendt bane og stigende kalkslam.

import {
    ROOM,
    getLevel,
    type Box,
    type HeisDef,
    type Ladder,
    type Level,
    type LevelId,
    type Rope,
    type StageDef,
    type V3,
    type WindDef,
} from './level';

export const STEP = 1 / 120;
const ROOM_Z0 = ROOM.z0;
const ROOM_Z1 = ROOM.z1;
export const POPE_HIGH_Y = 12.5;
export const POPE_REACH = 1.0;

export const R = 0.3; // halv bredde
export const H = 1.7; // høyde
export const HANDS = 1.6;

export interface Tuning {
    run: number;
    jumpH: number;
    airCtl: number;
    ladder: number;
    wall: number;
    wallMax: number;
    rope: number;
    wallJumps: number;
    climbUp: number;
    swayRate: number;
    fallMax: number;
}

export const WITH_BUCKET: Tuning = {
    run: 5.2,
    jumpH: 1.6,
    airCtl: 0.55,
    ladder: 2.2,
    wall: 1.4,
    wallMax: 2,
    rope: 1.6,
    wallJumps: 2,
    climbUp: 0.5,
    swayRate: 1.5,
    fallMax: 3,
};

export const ACCEL = 40;
export const BRAKE = 55;
/** På våt puss: fra full fart glir du ca. 1,5 m før du står. */
export const WET_RATE = 9;
export const G_UP = 30;
export const G_DOWN = 40;
export const TERMINAL = 22;
export const COYOTE = 0.12;
export const BUFFER = 0.15;
export const CUT = 0.4;
export const NARROW_SPEED = 3.0;
export const WJ_OUT = 4;
export const WJ_UP = 1.8;
/** Trekken dytter deg ut fra veggen (m/s), hardere i lufta. */
export const WIND_GROUND = 2.2;
export const WIND_AIR = 3.2;
/** Talje-heisen: sekken står oppe, går ned (kroken opp), står nede, går opp (kroken ned). */
export const HEIS_TOP = 1.6;
export const HEIS_DOWN = 2.0;
export const HEIS_BOTTOM = 0.8;
export const HEIS_LOAD = 0.4; // halv størrelse på sekken
export const STUNT_POINTS = 150;

export type Challenge = 'ingen' | 'utenCp' | 'speil' | 'slam';

/** Ekstra poeng for utfordringene (ganger sluttsummen). */
export const CHALLENGE_BONUS: Record<Challenge, number> = {
    ingen: 1,
    utenCp: 1.5,
    speil: 1.25,
    slam: 1.5,
};

export interface Input {
    /** -1..1 høyre/venstre relativt til kameraet. */
    x: number;
    /** -1..1 fram/tilbake relativt til kameraet. På stige, vegg og tau: opp/ned. */
    z: number;
    /** Hopp holdt inne (variabel hopphøyde). */
    jump: boolean;
    /** Teller hopp-trykk. Et nytt tall = et nytt trykk (hopp-buffer). */
    presses: number;
    /** Kameraets vinkel rundt y-aksen (radianer). 0 = ser mot nordveggen (-z). */
    yaw: number;
}

export type Mode =
    | 'ground'
    | 'air'
    | 'hang'
    | 'climbup'
    | 'ladder'
    | 'wall'
    | 'rope'
    | 'heis'
    | 'spill';
export type SpillCause = 'fall' | 'planke' | 'tau' | 'talje' | 'balanse' | 'kalk' | 'trekk';
export type LoseCause = 'puss' | 'paven' | 'slam' | 'dag';

export interface Ev {
    k:
        | 'jump'
        | 'land'
        | 'grab'
        | 'wj'
        | 'spill'
        | 'respawn'
        | 'creak'
        | 'plankfall'
        | 'find'
        | 'cp'
        | 'win'
        | 'lose'
        | 'thrown'
        | 'fork'
        | 'stunt'
        | 'intro'
        | 'gust'
        | 'crumble'
        | 'crack'
        | 'hook'
        | 'nesten'
        | 'hair'
        | 'refill'
        | 'dry';
    a?: string;
    p?: V3;
}

export interface G {
    seed: number;
    L: Level;
    ch: Challenge;
    t: number;
    acc: number;
    ended: null | 'vunnet' | 'tapt';
    cause: LoseCause;
    tun: Tuning;
    input: Input;
    seenPresses: number;

    p: V3;
    v: V3;
    mode: Mode;
    facing: number;
    onBox: Box | null;
    coyote: number;
    jumpBuf: number;
    cut: boolean;
    apexY: number;
    landT: number; // tid siden siste landing (squash i visningen)
    landHard: number;

    hangN: [number, number];
    hangTop: number;
    climbFrom: V3;
    climbTo: V3;
    climbT: number;
    climbDur: number;
    ladder: Ladder | null;
    rope: Rope | null;
    heis: number; // hvilken talje-heis du henger i (-1 = ingen)
    wallBox: Box | null;
    wallN: [number, number];
    wallT: number;
    wallJumps: number;
    /** Veggsprett siden sist du sto på noe (snarveien i sjakta). */
    wjRun: number;
    wallClimbed: number;
    cd: number; // kort pause før nytt grep (stige/tau/kant)

    sway: number;
    swayOn: boolean;

    cp: number;
    /** Etappe-klokka (giornata): sekunder siden kalkkaret, og hvor lenge pussen i bøtta holder. */
    etT: number;
    etLen: number;
    /** Sjekkpunkter du har hoppet over med en snarvei (gir 30 % av den etappens tid ekstra, én gang). */
    skipped: boolean[];
    /** Hvor mange ganger pussen tørket (tilbake til kalkkaret). */
    dries: number;
    /** Sum av «Våt puss»-bonusene. */
    wet: number;
    /** Sekunder uten å flytte seg (paven går raskere mot den som nøler). */
    still: number;
    lastP: V3;
    spillT: number;
    spillCause: SpillCause;
    spills: Record<SpillCause, number>;
    respawns: number;
    thrownT: number;

    /** Per plankegruppe: -1 = ingen har tråkket; ellers sekunder siden første tråkk. */
    plankT: number[];
    plankY: number[]; // hvor langt plankene har falt
    plankVy: number[];
    /** Per kjede med tørr puss: -1 = urørt; ellers sekunder siden første tråkk. */
    crumbleT: number[];

    stage: V3[];
    stageV: V3[];
    stageBoxes: Box[];
    stageLastT: number; // sist du sto på et tau-stillas
    stageLastU: number; // hvor langt ute det var da
    talje: V3[];
    /** Per vindu: siste varslede vindkast (så varselet kommer én gang). */
    gustSeen: number[];

    popeS: number;
    pope: V3;
    popeActive: boolean;
    popeMin: number;
    /** Hvor langt paven har gått ut fra stien sin mot deg (samme gulv, like ved). */
    popeOff: number;
    slam: number; // høyden på kalkslammet (utfordringen)

    finds: boolean[];
    findT: number[]; // når funnet ble tatt (for sprett-animasjonen)
    forks: boolean[];
    intros: boolean[];
    valg: number;
    maxY: number;
    stageRides: number;
    stageTries: number;
    /** Poeng-multiplikator for rene strekk uten søl (×1-×4). */
    mult: number;
    cleanSinceCp: boolean;
    bonus: number;
    stunts: Record<string, number>;
    /** Paven har vært innen 2 m (venter på at du slipper unna for «På hengende håret»). */
    popeClose: boolean;
    /** Sekunder til neste «På hengende håret» kan gis. */
    hairCd: number;
    hairs: number;
    trail: number[]; // x,y,z hvert 0,1 s
    trailT: number;
    ev: Ev[];
}

const v3 = (x = 0, y = 0, z = 0): V3 => [x, y, z];

// ---------------------------------------------------------------------------
// Pavens sti: forhåndsregnet lengde per bane
// ---------------------------------------------------------------------------

const PATHS = new WeakMap<Level, { len: number[]; total: number }>();
function pathInfo(L: Level) {
    let pi = PATHS.get(L);
    if (!pi) {
        const P = L.popePath;
        const len = [0];
        for (let i = 1; i < P.length; i++) {
            const a = P[i - 1];
            const b = P[i];
            len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
        }
        pi = { len, total: len[len.length - 1] };
        PATHS.set(L, pi);
    }
    return pi;
}

function pathPoint(L: Level, s: number, out: V3): V3 {
    const { len, total } = pathInfo(L);
    const P = L.popePath;
    const c = Math.max(0, Math.min(total, s));
    let i = 1;
    while (i < len.length - 1 && len[i] < c) i++;
    const a = P[i - 1];
    const b = P[i];
    const seg = len[i] - len[i - 1] || 1;
    const u = (c - len[i - 1]) / seg;
    out[0] = a[0] + (b[0] - a[0]) * u;
    out[1] = a[1] + (b[1] - a[1]) * u;
    out[2] = a[2] + (b[2] - a[2]) * u;
    return out;
}

/** Nærmeste punkt på pavens sti (som lengde langs stien). */
function projectOnPath(L: Level, p: V3): number {
    const { len } = pathInfo(L);
    const P = L.popePath;
    let best = 0;
    let bestD = Infinity;
    for (let i = 1; i < P.length; i++) {
        const a = P[i - 1];
        const b = P[i];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        const L2 = dx * dx + dy * dy + dz * dz || 1;
        let u = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy + (p[2] - a[2]) * dz) / L2;
        u = Math.max(0, Math.min(1, u));
        const qx = a[0] + dx * u - p[0];
        const qy = (a[1] + dy * u - p[1]) * 2; // høyde teller dobbelt: paven er ikke på feil etasje
        const qz = a[2] + dz * u - p[2];
        const d = qx * qx + qy * qy + qz * qz;
        if (d < bestD) {
            bestD = d;
            best = len[i - 1] + Math.sqrt(L2) * u;
        }
    }
    return best;
}

/** Lengste s på stien der høyden er minst `below` under y. */
function sBelow(L: Level, y: number, below: number): number {
    const { len } = pathInfo(L);
    let s = 0;
    const lim = y - below;
    for (let i = 0; i < L.popePath.length; i++)
        if (L.popePath[i][1] <= lim + 1e-6) s = len[i];
        else break;
    return s;
}

// ---------------------------------------------------------------------------
// Oppstart
// ---------------------------------------------------------------------------

export function emptyInput(): Input {
    return { x: 0, z: 0, jump: false, presses: 0, yaw: 0 };
}

export interface GameOpts {
    level?: LevelId;
    ch?: Challenge;
}

export function newGame(seed = 1, opts: GameOpts = {}): G {
    const ch = opts.ch ?? 'ingen';
    const L = getLevel(opts.level ?? 'forste', ch === 'speil');
    const g: G = {
        seed,
        L,
        ch,
        t: 0,
        acc: 0,
        ended: null,
        cause: 'puss',
        tun: WITH_BUCKET,
        input: emptyInput(),
        seenPresses: 0,
        p: v3(...L.start),
        v: v3(),
        mode: 'ground',
        facing: L.checkpoints[0].facing,
        onBox: null,
        coyote: 0,
        jumpBuf: 0,
        cut: true,
        apexY: 0,
        landT: 1,
        landHard: 0,
        hangN: [0, 1],
        hangTop: 0,
        climbFrom: v3(),
        climbTo: v3(),
        climbT: 0,
        climbDur: 0.4,
        ladder: null,
        rope: null,
        heis: -1,
        wallBox: null,
        wallN: [0, 1],
        wallT: 0,
        wallJumps: 0,
        wjRun: 0,
        wallClimbed: 0,
        cd: 0,
        sway: 0,
        swayOn: false,
        cp: 0,
        etT: 0,
        etLen: L.etapper[0],
        skipped: L.checkpoints.map(() => false),
        dries: 0,
        wet: 0,
        still: 0,
        lastP: v3(...L.start),
        spillT: 0,
        spillCause: 'fall',
        spills: { fall: 0, planke: 0, tau: 0, talje: 0, balanse: 0, kalk: 0, trekk: 0 },
        respawns: 0,
        thrownT: 0,
        plankT: L.planks.map(() => -1),
        plankY: L.planks.map(() => 0),
        plankVy: L.planks.map(() => 0),
        crumbleT: L.crumbles.map(() => -1),
        stage: L.stages.map((s) => v3(...s.a)),
        stageV: L.stages.map(() => v3()),
        stageBoxes: L.stages.map((_s, i) => ({
            id: -1 - i,
            min: v3(),
            max: v3(),
            kind: 'bjelke',
        })),
        stageLastT: -9,
        stageLastU: 0,
        talje: L.taljer.map((t) => v3(t.x, t.y0, t.zc)),
        gustSeen: L.winds.map(() => -1),
        popeS: 0,
        pope: v3(...L.popePath[0]),
        popeActive: false,
        popeMin: 99,
        popeOff: 0,
        slam: -0.5,
        finds: L.finds.map(() => false),
        findT: L.finds.map(() => -1),
        forks: L.forks.map(() => false),
        intros: L.intros.map(() => false),
        valg: 0,
        maxY: 0,
        stageRides: 0,
        stageTries: 0,
        mult: 1,
        cleanSinceCp: true,
        bonus: 0,
        stunts: {},
        popeClose: false,
        hairCd: 0,
        hairs: 0,
        trail: [],
        trailT: 0,
        ev: [],
    };
    updateStages(g, 0);
    return g;
}

function emit(g: G, e: Ev) {
    if (g.ev.length < 40) g.ev.push(e);
}

function stunt(g: G, name: string) {
    g.stunts[name] = (g.stunts[name] ?? 0) + 1;
    g.bonus += STUNT_POINTS * g.mult;
    emit(g, { k: 'stunt', a: name, p: [g.p[0], g.p[1], g.p[2]] });
}

/**
 * «På hengende håret»: et nesten-søl eller en nesten-pave. `nesten` er selve øyeblikket (sakte
 * film i nettleseren); poengene kommer når faren er over (`hair`).
 */
export const HAIR_POINTS = 100;
export const POPE_NEAR = 2.0;
function nearMiss(g: G, what: string, pay: boolean) {
    if (g.hairCd > 0 && what !== 'pave-unna') return;
    g.hairCd = 3;
    const p: V3 = [g.p[0], g.p[1], g.p[2]];
    emit(g, { k: 'nesten', a: what, p });
    if (!pay) return;
    g.hairs++;
    g.bonus += HAIR_POINTS * g.mult;
    emit(g, { k: 'hair', a: what, p });
}

// ---------------------------------------------------------------------------
// Bevegelige ting
// ---------------------------------------------------------------------------

/** Fase 0-1 for et tau-stillas: 0 = ved A, 0,5 = ved B. */
export function stagePhase(s: StageDef, t: number) {
    return (t / s.period) % 1;
}

/** Hvor langt fram (0-1) stillaset er mellom A og B ved tida t. */
export function stageU(s: StageDef, t: number) {
    return (1 - Math.cos(2 * Math.PI * stagePhase(s, t))) / 2;
}

export function stageAt(s: StageDef, t: number, out: V3): V3 {
    const u = stageU(s, t);
    out[0] = s.a[0] + (s.b[0] - s.a[0]) * u;
    out[1] = s.a[1] + (s.b[1] - s.a[1]) * u - s.sag * Math.sin(Math.PI * u);
    out[2] = s.a[2] + (s.b[2] - s.a[2]) * u;
    return out;
}

const TMP: V3 = [0, 0, 0];
function updateStages(g: G, dt: number) {
    g.L.stages.forEach((s, i) => {
        stageAt(s, g.t, TMP);
        const cur = g.stage[i];
        if (dt > 0) {
            g.stageV[i][0] = (TMP[0] - cur[0]) / dt;
            g.stageV[i][1] = (TMP[1] - cur[1]) / dt;
            g.stageV[i][2] = (TMP[2] - cur[2]) / dt;
        }
        cur[0] = TMP[0];
        cur[1] = TMP[1];
        cur[2] = TMP[2];
        const b = g.stageBoxes[i];
        for (let k = 0; k < 3; k++) {
            b.min[k] = cur[k] - s.half[k];
            b.max[k] = cur[k] + s.half[k];
        }
    });
}

export function taljeZ(t: { zc: number; amp: number; period: number }, time: number) {
    return t.zc + t.amp * Math.sin((2 * Math.PI * time) / t.period);
}

export function isStage(b: Box | null) {
    return !!b && b.id < 0;
}
export function stageIndex(b: Box) {
    return -1 - b.id;
}

export function plankSolid(g: G, grp: number) {
    return g.plankT[grp] < g.L.planks[grp].fall;
}

/** Når faller flis nummer k i en kjede (sekunder etter første tråkk)? */
export function crumbleFallAt(c: { delay: number; gap: number }, k: number) {
    return c.delay + c.gap * k;
}

export function tileSolid(g: G, ci: number, k: number) {
    const t = g.crumbleT[ci];
    return t < 0 || t < crumbleFallAt(g.L.crumbles[ci], k);
}

/** Talje-heisen: fase 0-period. */
export function heisPhase(h: HeisDef, t: number) {
    return (((t + h.offset) % h.period) + h.period) % h.period;
}

/** Hvor høyt kroken står over bunnen (0 = nede, 1 = oppe). */
export function hookU(h: HeisDef, t: number) {
    const u = heisPhase(h, t);
    if (u < HEIS_TOP) return 0;
    if (u < HEIS_TOP + HEIS_DOWN) return (u - HEIS_TOP) / HEIS_DOWN;
    if (u < HEIS_TOP + HEIS_DOWN + HEIS_BOTTOM) return 1;
    const up = h.period - HEIS_TOP - HEIS_DOWN - HEIS_BOTTOM;
    return 1 - (u - HEIS_TOP - HEIS_DOWN - HEIS_BOTTOM) / up;
}

/** Høyden på undersiden av sekken (sekken går motsatt av kroken). */
export function loadY(h: HeisDef, t: number) {
    return h.y0 + (1 - hookU(h, t)) * (h.lift + 1);
}

/** Vindkast: 'rolig', 'varsel' (gardinsus og støv) eller 'kast'. */
export function windState(w: WindDef, t: number): 'rolig' | 'varsel' | 'kast' {
    const ph = (((t - w.offset) % w.period) + w.period) % w.period;
    if (ph < w.dur) return 'kast';
    if (ph > w.period - w.warn) return 'varsel';
    return 'rolig';
}

function inWind(w: WindDef, p: V3) {
    return (
        p[0] > w.min[0] &&
        p[0] < w.max[0] &&
        p[1] > w.min[1] &&
        p[1] < w.max[1] &&
        p[2] > w.min[2] &&
        p[2] < w.max[2]
    );
}

/** Alle bokser som bærer akkurat nå. */
function solids(g: G): Box[] {
    const out = SOLIDS;
    out.length = 0;
    for (const b of g.L.static) out.push(b);
    g.L.planks.forEach((pg, i) => {
        if (plankSolid(g, i)) for (const b of pg.boxes) out.push(b);
    });
    g.L.crumbles.forEach((c, i) => {
        c.tiles.forEach((b, k) => {
            if (tileSolid(g, i, k)) out.push(b);
        });
    });
    for (const b of g.stageBoxes) out.push(b);
    return out;
}
const SOLIDS: Box[] = [];

/** Du tråkket på noe: løse planker knaker, tørr puss begynner å løsne. */
function touch(g: G, b: Box) {
    if (b.kind === 'planke') {
        const gi = b.grp ?? 0;
        if (g.plankT[gi] < 0) g.plankT[gi] = 0;
    } else if (b.kind === 'kalk') {
        g.L.crumbles.forEach((c, i) => {
            if (g.crumbleT[i] < 0 && c.tiles.includes(b)) {
                g.crumbleT[i] = 0;
                emit(g, { k: 'crumble', a: String(i), p: [g.p[0], g.p[1], g.p[2]] });
            }
        });
    }
}

// ---------------------------------------------------------------------------
// Kollisjon: akse for akse
// ---------------------------------------------------------------------------

const EPS = 1e-4;

function overlaps(p: V3, b: Box) {
    return (
        p[0] - R < b.max[0] - EPS &&
        p[0] + R > b.min[0] + EPS &&
        p[1] < b.max[1] - EPS &&
        p[1] + H > b.min[1] + EPS &&
        p[2] - R < b.max[2] - EPS &&
        p[2] + R > b.min[2] + EPS
    );
}

function lo(ax: number) {
    return ax === 1 ? 0 : R;
}
function hi(ax: number) {
    return ax === 1 ? H : R;
}

/** Flytter figuren langs én akse og skyver den ut av det den treffer. Gir boksen den traff. */
function moveAxis(g: G, list: Box[], ax: number, d: number): Box | null {
    if (d === 0) return null;
    // Del opp store steg: aldri lenger enn 0,1 m om gangen (ingen tunnelering).
    const n = Math.max(1, Math.ceil(Math.abs(d) / 0.1));
    const s = d / n;
    let hit: Box | null = null;
    for (let k = 0; k < n; k++) {
        g.p[ax] += s;
        let any = false;
        for (const b of list) {
            if (!overlaps(g.p, b)) continue;
            any = true;
            if (s > 0) g.p[ax] = b.min[ax] - hi(ax);
            else g.p[ax] = b.max[ax] + lo(ax);
            // Foretrekk stein/bjelke som bakken du står på (ikke stillaset) når begge treffes.
            if (!hit || (isStage(hit) && !isStage(b))) hit = b;
        }
        if (any) break;
    }
    return hit;
}

function freeAt(list: Box[], p: V3) {
    for (const b of list) if (overlaps(p, b)) return false;
    return true;
}

// ---------------------------------------------------------------------------
// Input til verdensretning
// ---------------------------------------------------------------------------

const DIR: [number, number] = [0, 0];
export function worldDir(inp: Input, out: [number, number] = DIR): [number, number] {
    const c = Math.cos(inp.yaw);
    const s = Math.sin(inp.yaw);
    let x = inp.x * c - inp.z * s;
    let z = -inp.x * s - inp.z * c;
    const m = Math.hypot(x, z);
    if (m > 1) {
        x /= m;
        z /= m;
    }
    out[0] = x;
    out[1] = z;
    return out;
}

/** Omvendt: hvilken input gir denne verdensretningen med denne kameravinkelen. */
export function inputFor(dx: number, dz: number, yaw: number): [number, number] {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return [dx * c - dz * s, -dx * s - dz * c];
}

const jumpV = (h: number) => Math.sqrt(2 * G_UP * h);

// ---------------------------------------------------------------------------
// Hovedløkka
// ---------------------------------------------------------------------------

/** Kjører spillet dt sekunder fram med fast tidssteg. */
export function update(g: G, dt: number) {
    if (g.ended) return;
    g.acc += Math.min(dt, 0.25);
    while (g.acc >= STEP - 1e-9 && !g.ended) {
        g.acc -= STEP;
        tick(g, STEP);
    }
}

function tick(g: G, dt: number) {
    g.t += dt;
    const L = g.L;
    const inp = g.input;
    if (inp.presses !== g.seenPresses) {
        g.seenPresses = inp.presses;
        g.jumpBuf = BUFFER;
    } else g.jumpBuf = Math.max(0, g.jumpBuf - dt);
    g.coyote = Math.max(0, g.coyote - dt);
    g.cd = Math.max(0, g.cd - dt);
    g.hairCd = Math.max(0, g.hairCd - dt);
    g.wallT = Math.max(0, g.wallT - dt);
    g.landT += dt;

    // Tau-stillasene og taljene
    let carry: V3 | null = null;
    if (g.mode === 'ground' && isStage(g.onBox)) {
        const c = g.stage[stageIndex(g.onBox!)];
        carry = [c[0], c[1], c[2]];
    }
    updateStages(g, dt);
    L.taljer.forEach((tj, i) => (g.talje[i][2] = taljeZ(tj, g.t)));

    // Plankene
    L.planks.forEach((pg, i) => {
        if (g.plankT[i] < 0) return;
        const before = g.plankT[i];
        g.plankT[i] += dt;
        if (before < pg.creak && g.plankT[i] >= pg.creak) emit(g, { k: 'creak', a: String(i) });
        if (before < pg.fall && g.plankT[i] >= pg.fall) emit(g, { k: 'plankfall', a: String(i) });
        if (g.plankT[i] >= pg.fall) {
            g.plankVy[i] -= G_DOWN * dt;
            g.plankY[i] += g.plankVy[i] * dt;
        }
    });
    // Tørr puss i kjede
    L.crumbles.forEach((c, i) => {
        if (g.crumbleT[i] < 0) return;
        const before = g.crumbleT[i];
        g.crumbleT[i] += dt;
        const k = Math.floor((g.crumbleT[i] - c.delay) / c.gap);
        const k0 = Math.floor((before - c.delay) / c.gap);
        if (g.crumbleT[i] >= c.delay && k !== k0 && k < c.tiles.length) emit(g, { k: 'crack' });
    });

    const list = solids(g);

    switch (g.mode) {
        case 'spill':
            g.spillT -= dt;
            if (g.spillT <= 0) respawn(g);
            break;
        case 'ground':
        case 'air':
            if (carry && g.mode === 'ground' && isStage(g.onBox)) {
                // Stillaset bærer deg med seg.
                const si = stageIndex(g.onBox!);
                const s = g.stage[si];
                moveAxis(g, L.static, 0, s[0] - carry[0]);
                moveAxis(g, L.static, 2, s[2] - carry[2]);
                g.p[1] = s[1] + L.stages[si].half[1];
                g.stageLastT = g.t;
                g.stageLastU = stageU(L.stages[si], g.t);
            }
            wind(g, dt, list);
            if (g.mode === 'ground' || g.mode === 'air') walk(g, dt, list);
            break;
        case 'hang':
            hang(g, dt);
            break;
        case 'climbup':
            climbUp(g, dt);
            break;
        case 'ladder':
            ladder(g, dt);
            break;
        case 'wall':
            wall(g, dt, list);
            break;
        case 'rope':
            rope(g, dt);
            break;
        case 'heis':
            heisRide(g);
            break;
    }

    if (g.mode !== 'spill') {
        if (g.p[1] > g.maxY) g.maxY = g.p[1];
        hazards(g);
        pickups(g);
    }
    gusts(g);
    // Står du stille (mer enn 1,5 s), går paven raskere; går du jevnt fram, roligere.
    const moved = Math.hypot(g.p[0] - g.lastP[0], g.p[1] - g.lastP[1], g.p[2] - g.lastP[2]) / dt;
    if (moved < 0.6 && g.mode !== 'spill') g.still += dt;
    else g.still = 0;
    g.lastP[0] = g.p[0];
    g.lastP[1] = g.p[1];
    g.lastP[2] = g.p[2];
    pope(g, dt);
    if (g.ch === 'slam' && !g.ended) slam(g, dt);
    if (g.ended) return;

    // Spor til spøkelset
    g.trailT += dt;
    if (g.trailT >= 0.1) {
        g.trailT -= 0.1;
        g.trail.push(round2(g.p[0]), round2(g.p[1]), round2(g.p[2]));
    }

    // Etappe-klokka: pussen i bøtta tørker. Da er det tilbake til kalkkaret (på «Uten
    // sjekkpunkter» er runden over).
    // Mens du søler eller pussen tørker, står klokka: pausen er for å se hva som skjedde.
    if (g.mode !== 'spill') g.etT += dt;
    for (let k = g.cp + 1; k < L.checkpoints.length; k++) {
        if (g.skipped[k] || g.mode !== 'ground' || g.p[1] < L.checkpoints[k].p[1] + 1.0) continue;
        g.skipped[k] = true;
        g.etLen += L.etapper[k] * 0.3;
    }
    if (g.etT >= g.etLen) dry(g);
    if (g.ended) return;

    if (g.t >= L.clock) end(g, 'tapt', 'dag');
}

/** Resten på etappe-klokka blir poeng: «Våt puss +x». */
export const WET_POINTS = 20;
function wetBonus(g: G) {
    const left = Math.max(0, g.etLen - g.etT);
    const pts = Math.round(left) * WET_POINTS;
    g.bonus += pts;
    g.wet += pts;
    return pts;
}

/** Pussen tørket: tilbake til forrige kalkkar med fersk puss, og det koster poeng. */
export const DRY_PENALTY = 300;
export const DRY_PAUSE = 1.4;
function dry(g: G) {
    if (g.ch === 'utenCp') {
        end(g, 'tapt', 'puss');
        return;
    }
    g.dries++;
    g.bonus -= DRY_PENALTY;
    emit(g, { k: 'dry', p: [g.p[0], g.p[1], g.p[2]] });
    // Ikke rett tilbake: figuren står et øyeblikk med den tørre bøtta, så eleven ser hvorfor
    // før figuren er ved kalkkaret igjen (spill-modus kaller respawn når tida er ute).
    g.mode = 'spill';
    g.spillT = DRY_PAUSE;
    g.v = [0, 0, 0];
    g.ladder = null;
    g.rope = null;
    g.heis = -1;
    g.mult = 1;
    g.cleanSinceCp = false;
    g.etT = 0;
    g.etLen = g.L.etapper[g.cp];
}

const round2 = (x: number) => Math.round(x * 100) / 100;

function end(g: G, how: 'vunnet' | 'tapt', cause: LoseCause = 'puss') {
    if (g.ended) return;
    g.ended = how;
    g.cause = cause;
    emit(g, { k: how === 'vunnet' ? 'win' : 'lose', a: cause });
}

// ---------------------------------------------------------------------------
// Trekk fra vinduene: vindkast med fast takt dytter deg ut fra veggen
// ---------------------------------------------------------------------------

function wind(g: G, dt: number, list: Box[]) {
    for (const w of g.L.winds) {
        if (windState(w, g.t) !== 'kast' || !inWind(w, g.p)) continue;
        const sp = g.mode === 'air' ? WIND_AIR : WIND_GROUND;
        moveAxis(g, list, 0, w.dir[0] * sp * dt);
        moveAxis(g, list, 2, w.dir[1] * sp * dt);
        if (g.mode === 'air') g.spillCause = 'trekk';
    }
}

/** Varsel når et vindkast er på vei i et vindu i nærheten. */
function gusts(g: G) {
    g.L.winds.forEach((w, i) => {
        if (windState(w, g.t) !== 'varsel') return;
        const n = Math.floor((g.t - w.offset + w.warn) / w.period);
        if (g.gustSeen[i] === n) return;
        g.gustSeen[i] = n;
        const cx = (w.min[0] + w.max[0]) / 2;
        const cy = (w.min[1] + w.max[1]) / 2;
        if (Math.abs(g.p[0] - cx) < 12 && Math.abs(g.p[1] - cy) < 5 && Math.sign(g.p[2]) === Math.sign(w.max[2]))
            emit(g, { k: 'gust', a: String(i) });
    });
}

// ---------------------------------------------------------------------------
// Løp, hopp, fall
// ---------------------------------------------------------------------------

function walk(g: G, dt: number, list: Box[]) {
    const T = g.tun;
    const inp = g.input;
    const d = worldDir(inp);
    const grounded = g.mode === 'ground';
    const narrow = grounded && g.onBox?.narrow ? g.onBox.narrow : null;

    let dx = d[0];
    let dz = d[1];
    // Balanse: på en smal bjelke brukes sidelengs styring til å holde balansen.
    if (narrow) {
        const lat = narrow === 'x' ? dz : dx;
        if (narrow === 'x') dz = 0;
        else dx = 0;
        balance(g, dt, lat);
        if (g.mode !== 'ground') return;
    } else {
        g.swayOn = false;
        g.sway *= Math.max(0, 1 - dt * 6);
    }

    const max = narrow ? Math.min(NARROW_SPEED, T.run) : T.run;
    const tx = dx * max;
    const tz = dz * max;
    const hasIn = Math.hypot(dx, dz) > 0.05;
    // Våt puss: halv friksjon og mer, du sklir videre.
    const wet = grounded && !!g.onBox?.wet;
    const rate = wet ? WET_RATE : grounded ? (hasIn ? ACCEL : BRAKE) : hasIn ? ACCEL * T.airCtl : 2;
    const ex = tx - g.v[0];
    const ez = tz - g.v[2];
    const el = Math.hypot(ex, ez);
    const step = rate * dt;
    if (el <= step) {
        g.v[0] = tx;
        g.v[2] = tz;
    } else if (grounded || hasIn) {
        g.v[0] += (ex / el) * step;
        g.v[2] += (ez / el) * step;
    }
    if (Math.hypot(g.v[0], g.v[2]) > 0.4) g.facing = Math.atan2(g.v[0], g.v[2]);

    // Hopp (med coyote-tid og hopp-buffer)
    if (g.jumpBuf > 0 && (grounded || g.coyote > 0)) {
        if (isStage(g.onBox) && grounded) {
            // Hopper du fra stillaset, får du farten dets med deg.
            const sv = g.stageV[stageIndex(g.onBox!)];
            g.v[0] += sv[0];
            g.v[2] += sv[2];
        }
        g.v[1] = jumpV(T.jumpH);
        g.jumpBuf = 0;
        g.coyote = 0;
        g.cut = false;
        g.mode = 'air';
        g.onBox = null;
        g.apexY = g.p[1];
        emit(g, { k: 'jump' });
    } else if (g.mode === 'air' && g.jumpBuf > 0 && g.wallT > 0 && g.wallJumps < T.wallJumps) {
        // Veggsprett
        g.v[0] = g.wallN[0] * WJ_OUT;
        g.v[2] = g.wallN[1] * WJ_OUT;
        g.v[1] = jumpV(WJ_UP);
        g.jumpBuf = 0;
        g.wallT = 0;
        g.wallJumps++;
        g.wjRun++;
        g.cut = false;
        g.apexY = g.p[1];
        g.facing = Math.atan2(g.v[0], g.v[2]);
        emit(g, { k: 'wj' });
    }

    // Variabel hopphøyde: slipp kutter oppfarten.
    if (g.mode === 'air' && !g.cut && g.v[1] > 0 && !inp.jump) {
        g.v[1] *= CUT;
        g.cut = true;
    }

    // Tyngdekraft
    g.v[1] -= (g.v[1] > 0 ? G_UP : G_DOWN) * dt;
    if (g.v[1] < -TERMINAL) g.v[1] = -TERMINAL;

    // Flytt: x, z, så y
    const hx = moveAxis(g, list, 0, g.v[0] * dt);
    if (hx) {
        wallContact(g, hx, g.v[0] > 0 ? -1 : 1, 0);
        g.v[0] = 0;
    }
    const hz = moveAxis(g, list, 2, g.v[2] * dt);
    if (hz) {
        wallContact(g, hz, 0, g.v[2] > 0 ? -1 : 1);
        g.v[2] = 0;
    }
    const wasAir = g.mode === 'air';
    const vy = g.v[1];
    const hy = moveAxis(g, list, 1, g.v[1] * dt);
    if (hy && vy <= 0) {
        g.v[1] = 0;
        if (wasAir) land(g, hy, vy);
        else g.onBox = hy;
        if (g.mode === 'ground') {
            g.onBox = hy;
            touch(g, hy);
        }
    } else {
        if (hy && vy > 0) g.v[1] = 0; // slo hodet
        if (g.mode === 'ground') {
            // Gikk utfor kanten: coyote-tid.
            if (g.onBox?.kind === 'planke' && !plankSolid(g, g.onBox.grp ?? 0)) g.spillCause = 'planke';
            if (g.onBox?.kind === 'kalk') g.spillCause = 'kalk';
            g.mode = 'air';
            g.coyote = COYOTE;
            g.apexY = g.p[1];
            g.onBox = null;
            g.cut = true;
        }
    }
    if (g.mode === 'air') {
        if (g.p[1] > g.apexY) g.apexY = g.p[1];
        if (g.cd <= 0) grabs(g, list);
    } else if (g.mode === 'ground') {
        // Gå inn på stige fra bakken
        if (g.cd <= 0 && !tryLadder(g)) tryWall(g, list);
    }
}

function land(g: G, b: Box, vy: number) {
    const fall = g.apexY - g.p[1];
    g.mode = 'ground';
    g.onBox = b;
    g.wallJumps = 0;
    g.wjRun = 0;
    g.landT = 0;
    g.landHard = Math.min(1, Math.max(0, (-vy - 4) / 12));
    if (fall > g.tun.fallMax + 1e-3) {
        spill(g, 'fall');
        return;
    }
    if (isStage(b)) {
        g.stageTries++;
        const si = stageIndex(b);
        const sv = g.stageV[si];
        const rel = Math.hypot(sv[0], sv[1], sv[2]);
        if (rel > g.L.stages[si].maxLand) {
            // Stillaset vrir seg og kaster deg av.
            g.mode = 'air';
            g.onBox = null;
            g.v[0] = sv[0] * 1.3;
            g.v[2] = sv[2] * 1.3;
            g.v[1] = 5;
            g.cut = true;
            g.apexY = g.p[1] + 1;
            g.thrownT = 0.9;
            g.cd = 1;
            emit(g, { k: 'thrown' });
            return;
        }
        g.stageRides++;
    } else if (g.t - g.stageLastT < 1.2 && g.stageLastU >= 0.85) {
        // Gikk av tau-stillaset i ytterpunktet: tau-flukten.
        g.stageLastT = -9;
        stunt(g, 'tau');
    }
    // På hengende håret: et fall like under søl-grensa, eller landing helt ytterst på kanten.
    if (fall > g.tun.fallMax - 0.45) nearMiss(g, 'søl', true);
    else if (Math.hypot(g.v[0], g.v[2]) > 1.5 && b.kind !== 'gulv') {
        const e = Math.min(g.p[0] - b.min[0], b.max[0] - g.p[0]);
        let ez = Infinity;
        if (b.min[2] > ROOM_Z0 + 0.05) ez = Math.min(ez, g.p[2] - b.min[2]);
        if (b.max[2] < ROOM_Z1 - 0.05) ez = Math.min(ez, b.max[2] - g.p[2]);
        if (Math.min(e, ez) < 0.08) nearMiss(g, 'kant', true);
    }
    touch(g, b);
    g.spillCause = 'fall';
    emit(g, { k: 'land', a: b.kind });
}

function wallContact(g: G, b: Box, nx: number, nz: number) {
    if (g.mode !== 'air' || isStage(b) || b.kind === 'planke') return;
    if (b.max[1] - b.min[1] < 1.2 && b.kind !== 'stein') return;
    g.wallN = [nx, nz];
    g.wallT = 0.12;
    g.wallBox = b;
    // Grepbar vegg: klatre hvis du presser inn i den.
    if (b.grip && g.cd <= 0) {
        const d = worldDir(g.input);
        if (-(d[0] * nx + d[1] * nz) > 0.5) startWall(g, b, nx, nz);
    }
}

// ---------------------------------------------------------------------------
// Balanse på smale bjelker
// ---------------------------------------------------------------------------

function balance(g: G, dt: number, lat: number) {
    g.swayOn = true;
    const speed = Math.hypot(g.v[0], g.v[2]);
    const drift = 0.5 * Math.sin(1.3 * g.t + g.seed * 1.7) * (0.6 + speed / 3);
    const a = 1.0 * g.tun.swayRate;
    g.sway += (a * g.sway + drift + 2.6 * lat) * dt;
    if (Math.abs(g.sway) >= 1) {
        // Mistet balansen: ut på siden.
        const s = Math.sign(g.sway);
        const narrow = g.onBox?.narrow;
        g.mode = 'air';
        g.onBox = null;
        g.apexY = g.p[1];
        g.coyote = 0;
        g.cut = true;
        g.cd = 0.6;
        if (narrow === 'x') {
            g.v[2] = s * 2.5;
            g.p[2] += s * 0.35;
        } else {
            g.v[0] = s * 2.5;
            g.p[0] += s * 0.35;
        }
        g.sway = 0;
        g.spillCause = 'balanse';
        emit(g, { k: 'thrown', a: 'balanse' });
    }
}

// ---------------------------------------------------------------------------
// Grep: kant, stige, tau, vegg
// ---------------------------------------------------------------------------

function grabs(g: G, list: Box[]) {
    if (g.thrownT > 0) return;
    if (tryLadder(g)) return;
    if (tryRope(g)) return;
    if (tryHeis(g)) return;
    if (g.v[1] < 2.5) tryLedge(g, list);
}

function tryLedge(g: G, list: Box[]): boolean {
    const d = worldDir(g.input);
    const handY = g.p[1] + HANDS;
    for (const b of g.L.static) {
        if (b.kind === 'gulv' || b.kind === 'vegg') continue;
        const top = b.max[1];
        if (top < handY - 0.5 || top > handY + 0.6) continue;
        for (let ax = 0; ax <= 2; ax += 2) {
            const o = ax === 0 ? 2 : 0;
            if (g.p[o] < b.min[o] + 0.1 || g.p[o] > b.max[o] - 0.1) continue;
            for (const side of [-1, 1]) {
                const face = side < 0 ? b.min[ax] : b.max[ax];
                const gap = side < 0 ? face - (g.p[ax] + R) : g.p[ax] - R - face;
                if (gap < -0.02 || gap > 0.45) continue;
                // Presser du mot flaten?
                const nx = ax === 0 ? side : 0;
                const nz = ax === 2 ? side : 0;
                if (-(d[0] * nx + d[1] * nz) < 0.3) continue;
                // Plass til å stå oppå?
                const onTop: V3 = [g.p[0], top, g.p[2]];
                onTop[ax] = face - side * (R + 0.35);
                if (!freeAt(list, onTop)) continue;
                g.mode = 'hang';
                g.hangN = [nx, nz];
                g.hangTop = top;
                g.p[ax] = face + side * (R + 0.02);
                g.p[1] = top - HANDS;
                g.v = [0, 0, 0];
                g.climbTo = onTop;
                g.wallJumps = 0;
                g.apexY = g.p[1];
                g.facing = Math.atan2(-nx, -nz);
                emit(g, { k: 'grab' });
                if (b.stunt && g.wjRun > 0) stunt(g, b.stunt);
                return true;
            }
        }
    }
    return false;
}

function hang(g: G, dt: number) {
    void dt;
    const d = worldDir(g.input);
    const toward = -(d[0] * g.hangN[0] + d[1] * g.hangN[1]);
    if (toward > 0.3 || g.jumpBuf > 0 || g.input.z > 0.5) {
        g.jumpBuf = 0;
        startClimb(g, g.climbTo, g.tun.climbUp);
    } else if (toward < -0.5 || g.input.z < -0.5) {
        g.mode = 'air';
        g.cd = 0.35;
        g.apexY = g.p[1];
        g.p[0] += g.hangN[0] * 0.05;
        g.p[2] += g.hangN[1] * 0.05;
    }
}

function startClimb(g: G, to: V3, time: number) {
    g.mode = 'climbup';
    g.climbFrom = [g.p[0], g.p[1], g.p[2]];
    g.climbTo = [to[0], to[1], to[2]];
    g.climbT = 0;
    g.v = [0, 0, 0];
    g.climbDur = time;
}

function climbUp(g: G, dt: number) {
    g.climbT += dt / (g.climbDur || 0.4);
    const u = Math.min(1, g.climbT);
    // Først opp, så inn over kanten.
    const uy = Math.min(1, u * 1.6);
    const uh = Math.max(0, (u - 0.4) / 0.6);
    g.p[0] = g.climbFrom[0] + (g.climbTo[0] - g.climbFrom[0]) * uh;
    g.p[1] = g.climbFrom[1] + (g.climbTo[1] - g.climbFrom[1]) * uy;
    g.p[2] = g.climbFrom[2] + (g.climbTo[2] - g.climbFrom[2]) * uh;
    if (u >= 1) {
        g.mode = 'ground';
        g.onBox = null;
        g.apexY = g.p[1];
        g.cd = 0.15;
        g.ladder = null;
        g.v = [0, 0, 0];
    }
}

function tryLadder(g: G): boolean {
    const d = worldDir(g.input);
    for (const L of g.L.ladders) {
        if (Math.abs(g.p[0] - L.x) > 0.5 || Math.abs(g.p[2] - L.z) > 0.55) continue;
        if (g.p[1] < L.y0 - 0.2 || g.p[1] > L.y1 - 0.4) continue;
        const toward = -(d[0] * L.n[0] + d[1] * L.n[1]);
        if (toward < 0.5) continue;
        g.mode = 'ladder';
        g.ladder = L;
        g.p[0] = L.x;
        g.p[2] = L.z;
        g.v = [0, 0, 0];
        g.wallJumps = 0;
        g.apexY = g.p[1];
        g.facing = Math.atan2(-L.n[0], -L.n[1]);
        emit(g, { k: 'grab', a: 'stige' });
        return true;
    }
    return false;
}

function ladder(g: G, dt: number) {
    const L = g.ladder!;
    const up = g.input.z;
    if (g.jumpBuf > 0) {
        // Hopp av bakover.
        g.jumpBuf = 0;
        g.mode = 'air';
        g.v = [L.n[0] * 3, jumpV(0.8), L.n[1] * 3];
        g.cd = 0.35;
        g.apexY = g.p[1];
        g.cut = true;
        g.ladder = null;
        return;
    }
    g.p[1] += up * g.tun.ladder * dt;
    g.apexY = g.p[1];
    if (g.p[1] >= L.y1) {
        g.p[1] = L.y1 - 0.01;
        startClimb(g, [L.x + L.exit[0], L.y1, L.z + L.exit[1]], 0.3);
        return;
    }
    if (g.p[1] <= L.y0) {
        g.p[1] = L.y0;
        if (up < 0) {
            g.mode = 'ground';
            g.ladder = null;
            g.cd = 0.3;
            g.onBox = null;
        }
    }
}

function tryRope(g: G): boolean {
    for (const r of g.L.ropes) {
        if (Math.hypot(g.p[0] - r.x, g.p[2] - r.z) > 0.5) continue;
        const hy = g.p[1] + 1.0;
        if (hy < r.yBot || hy > r.yTop) continue;
        g.mode = 'rope';
        g.rope = r;
        g.v = [0, 0, 0];
        g.wallJumps = 0;
        g.apexY = g.p[1];
        emit(g, { k: 'grab', a: 'tau' });
        return true;
    }
    return false;
}

function rope(g: G, dt: number) {
    const r = g.rope!;
    // Heng i tauet: du glir mot det og kan klatre.
    g.p[0] += (r.x - g.p[0]) * Math.min(1, dt * 12);
    g.p[2] += (r.z - g.p[2]) * Math.min(1, dt * 12);
    g.p[1] += g.input.z * g.tun.rope * dt;
    g.p[1] = Math.min(g.p[1], r.yTop - 1.9);
    g.apexY = g.p[1];
    if (g.p[1] + 1.0 < r.yBot) {
        g.mode = 'air';
        g.cd = 0.4;
        g.rope = null;
        return;
    }
    if (g.jumpBuf > 0) {
        g.jumpBuf = 0;
        const d = worldDir(g.input);
        const m = Math.hypot(d[0], d[1]);
        const fx = m > 0.2 ? d[0] / m : Math.sin(g.facing);
        const fz = m > 0.2 ? d[1] / m : Math.cos(g.facing);
        g.v = [fx * 4.5, jumpV(1.2), fz * 4.5];
        g.mode = 'air';
        g.cd = 0.35;
        g.cut = false;
        g.rope = null;
        g.facing = Math.atan2(fx, fz);
        emit(g, { k: 'jump' });
    }
}

function tryWall(g: G, list: Box[]): boolean {
    void list;
    const d = worldDir(g.input);
    for (const b of g.L.static) {
        if (!b.grip) continue;
        if (g.p[1] + 0.5 < b.min[1] || g.p[1] > b.max[1] - 0.5) continue;
        for (let ax = 0; ax <= 2; ax += 2) {
            const o = ax === 0 ? 2 : 0;
            if (g.p[o] < b.min[o] || g.p[o] > b.max[o]) continue;
            for (const side of [-1, 1]) {
                const face = side < 0 ? b.min[ax] : b.max[ax];
                const gap = side < 0 ? face - (g.p[ax] + R) : g.p[ax] - R - face;
                if (gap < -0.02 || gap > 0.08) continue;
                const nx = ax === 0 ? side : 0;
                const nz = ax === 2 ? side : 0;
                if (-(d[0] * nx + d[1] * nz) < 0.5) continue;
                startWall(g, b, nx, nz);
                return true;
            }
        }
    }
    return false;
}

function startWall(g: G, b: Box, nx: number, nz: number) {
    g.mode = 'wall';
    g.wallBox = b;
    g.wallN = [nx, nz];
    g.wallClimbed = 0;
    g.v = [0, 0, 0];
    g.apexY = g.p[1];
    g.facing = Math.atan2(-nx, -nz);
    emit(g, { k: 'grab', a: 'vegg' });
}

function wall(g: G, dt: number, list: Box[]) {
    const b = g.wallBox!;
    const T = g.tun;
    // Opp = «fram» eller mot veggen, uansett hvor kameraet står.
    const dw = worldDir(g.input);
    const up = Math.max(g.input.z, -(dw[0] * g.wallN[0] + dw[1] * g.wallN[1]));
    if (g.jumpBuf > 0) {
        // Sprett ut fra veggen.
        g.jumpBuf = 0;
        g.mode = 'air';
        g.v = [g.wallN[0] * WJ_OUT, jumpV(WJ_UP), g.wallN[1] * WJ_OUT];
        g.cd = 0.25;
        g.cut = false;
        g.apexY = g.p[1];
        g.wallJumps++;
        g.wjRun++;
        emit(g, { k: 'wj' });
        return;
    }
    let vy = 0;
    if (up > 0.3) vy = g.wallClimbed < T.wallMax ? T.wall : -0.6;
    else if (up < -0.3) vy = -T.wall;
    else vy = g.wallClimbed < T.wallMax ? 0 : -0.6;
    if (vy > 0) g.wallClimbed += vy * dt;
    // Sidelengs langs veggen
    const d = worldDir(g.input);
    const tx = -g.wallN[1];
    const tz = g.wallN[0];
    const side = (d[0] * tx + d[1] * tz) * 1.0;
    moveAxis(g, list, 0, tx * side * dt);
    moveAxis(g, list, 2, tz * side * dt);
    const hit = moveAxis(g, list, 1, vy * dt);
    g.apexY = Math.max(g.p[1], g.apexY - 0);
    if (hit && vy < 0) {
        g.mode = 'ground';
        g.onBox = hit;
        g.cd = 0.3;
        return;
    }
    // Hendene over toppen: kantgrep.
    if (g.p[1] + HANDS >= b.max[1] - 0.05) {
        const nx = g.wallN[0];
        const nz = g.wallN[1];
        const ax = nx !== 0 ? 0 : 2;
        const face = (nx || nz) < 0 ? b.min[ax] : b.max[ax];
        const onTop: V3 = [g.p[0], b.max[1], g.p[2]];
        onTop[ax] = face - (nx || nz) * (R + 0.35);
        if (freeAt(list, onTop)) {
            g.hangN = [nx, nz];
            g.hangTop = b.max[1];
            g.climbTo = onTop;
            if (b.stunt && g.wjRun > 0) stunt(g, b.stunt);
            startClimb(g, onTop, T.climbUp);
            return;
        }
    }
    // Gled av siden
    const o = g.wallN[0] !== 0 ? 2 : 0;
    if (g.p[o] < b.min[o] - R || g.p[o] > b.max[o] + R || g.p[1] > b.max[1]) {
        g.mode = 'air';
        g.cd = 0.3;
    }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Talje-heisen: grip kroken mens sekken står oppe, så drar den deg opp når sekken går ned
// ---------------------------------------------------------------------------

function tryHeis(g: G): boolean {
    for (let i = 0; i < g.L.heiser.length; i++) {
        const h = g.L.heiser[i];
        if (Math.abs(g.p[0] - h.x) > 0.45 || Math.abs(g.p[2] - h.z) > 0.45) continue;
        // Kroken må være nede (sekken oppe). Er den på vei opp, er det for sent.
        if (hookU(h, g.t) > 0.04) continue;
        if (g.p[1] < h.y0 - 0.2 || g.p[1] > h.y0 + 1.4) continue;
        g.mode = 'heis';
        g.heis = i;
        g.v = [0, 0, 0];
        g.wallJumps = 0;
        g.facing = Math.atan2(h.exit[0], h.exit[1]);
        emit(g, { k: 'grab', a: 'heis' });
        emit(g, { k: 'hook' });
        return true;
    }
    return false;
}

function heisRide(g: G) {
    const h = g.L.heiser[g.heis];
    const u = hookU(h, g.t);
    g.p[0] = h.x;
    g.p[2] = h.z;
    g.p[1] = h.y0 + 0.35 + u * h.lift;
    g.apexY = g.p[1];
    if (g.jumpBuf > 0) {
        // Slipp: du faller derfra du er.
        g.jumpBuf = 0;
        g.mode = 'air';
        g.cd = 0.4;
        g.cut = true;
        g.heis = -1;
        return;
    }
    if (u >= 1) {
        g.heis = -1;
        stunt(g, 'heis');
        startClimb(g, [h.x + h.exit[0], h.y0 + h.lift, h.z + h.exit[1]], 0.35);
    }
}

// ---------------------------------------------------------------------------
// Søl, sjekkpunkt, farer, funn, paven
// ---------------------------------------------------------------------------

function spill(g: G, cause: SpillCause) {
    if (g.mode === 'spill') return;
    const c: SpillCause =
        g.thrownT > 0 ? 'tau' : cause === 'fall' && g.spillCause !== 'fall' ? g.spillCause : cause;
    g.mode = 'spill';
    g.spillT = 0.55;
    g.spills[c]++;
    g.spillCause = c;
    g.v = [0, 0, 0];
    g.mult = 1;
    g.cleanSinceCp = false;
    g.heis = -1;
    emit(g, { k: 'spill', a: c, p: [g.p[0], g.p[1], g.p[2]] });
}

/** R: tilbake til sjekkpunktet med én gang. */
export function requestRespawn(g: G) {
    if (g.ended) return;
    respawn(g);
}

function respawn(g: G) {
    // Uten sjekkpunkter: søl = start på nytt, med fersk puss.
    if (g.ch === 'utenCp') {
        g.cp = 0;
        g.etT = 0;
        g.etLen = g.L.etapper[0];
        g.skipped = g.skipped.map(() => false);
    }
    const cp = g.L.checkpoints[g.cp];
    g.still = 0;
    g.p = [cp.p[0], cp.p[1], cp.p[2]];
    g.v = [0, 0, 0];
    g.mode = 'ground';
    g.onBox = null;
    g.apexY = g.p[1];
    g.sway = 0;
    g.swayOn = false;
    g.thrownT = 0;
    g.spillCause = 'fall';
    g.ladder = null;
    g.rope = null;
    g.heis = -1;
    g.wallJumps = 0;
    g.wjRun = 0;
    g.cd = 0.2;
    g.facing = cp.facing;
    g.plankT = g.plankT.map(() => -1);
    g.plankY = g.plankY.map(() => 0);
    g.plankVy = g.plankVy.map(() => 0);
    g.crumbleT = g.crumbleT.map(() => -1);
    g.stageLastT = -9;
    g.popeClose = false;
    g.respawns++;
    // Paven settes minst 8 m under sjekkpunktet, så en respawn aldri blir en felle.
    if (g.popeActive) {
        const lim = cp.popeBelow > 0 ? sBelow(g.L, cp.p[1], cp.popeBelow) : 0;
        if (g.popeS > lim) g.popeS = lim;
        g.popeOff = 0;
        pathPoint(g.L, g.popeS, g.pope);
    }
    emit(g, { k: 'respawn' });
}

function hits(g: G, cx: number, cy: number, cz: number, h: number) {
    return (
        Math.abs(g.p[0] - cx) < h + R &&
        Math.abs(g.p[2] - cz) < h + R &&
        g.p[1] < cy + h &&
        g.p[1] + H > cy - h
    );
}

function hazards(g: G) {
    const L = g.L;
    if (g.thrownT > 0) {
        g.thrownT -= STEP;
        if (g.thrownT <= 0 && g.mode === 'air') spill(g, 'tau');
    }
    // Taljene: treff = søl
    L.taljer.forEach((tj, i) => {
        const tz = g.talje[i][2];
        if (hits(g, tj.x, tj.y0 + tj.half, tz, tj.half)) spill(g, 'talje');
        else if (g.mode !== 'spill') {
            // Sekken suser forbi uten å treffe
            const d = Math.hypot(tj.x - g.p[0], tj.y0 + tj.half - (g.p[1] + 0.9), tz - g.p[2]);
            if (d < tj.half + 0.75 && d > tj.half + 0.35) nearMiss(g, 'talje', true);
        }
    });
    // Sekken i talje-heisen: står du i søylen dens når den kommer ned, er det søl.
    for (const h of L.heiser) {
        if (g.mode === 'heis') break;
        const ly = loadY(h, g.t);
        if (hits(g, h.x + h.loadDx, ly + HEIS_LOAD, h.z, HEIS_LOAD)) spill(g, 'talje');
    }
    if (g.mode === 'spill') return;
    // Sjekkpunkter
    if (g.mode === 'ground') {
        for (let i = g.cp + 1; i < L.checkpoints.length; i++) {
            const c = L.checkpoints[i].p;
            if (Math.abs(g.p[1] - c[1]) < 0.3 && Math.hypot(g.p[0] - c[0], g.p[2] - c[2]) < 1.4) {
                g.cp = i;
                if (g.cleanSinceCp) g.mult = Math.min(4, g.mult + 1);
                g.cleanSinceCp = true;
                emit(g, { k: 'cp', a: String(i) });
                // Kalkkaret: fersk puss i bøtta, og klokka fylles til denne etappens tid.
                emit(g, { k: 'refill', a: String(wetBonus(g)), p: [c[0], c[1], c[2]] });
                g.etT = 0;
                g.etLen = L.etapper[i];
                break;
            }
        }
        // Mål: på mesterens plattform med bøtta.
        if (g.onBox?.kind === 'mester' || g.p[1] >= L.goalY - 0.05) {
            wetBonus(g);
            end(g, 'vunnet');
        }
    }
}

function pickups(g: G) {
    const L = g.L;
    const cx = g.p[0];
    const cy = g.p[1] + 0.85;
    const cz = g.p[2];
    for (let i = 0; i < L.finds.length; i++) {
        if (g.finds[i]) continue;
        const f = L.finds[i].p;
        if (Math.hypot(f[0] - cx, f[1] - cy, f[2] - cz) < 1.0) {
            g.finds[i] = true;
            g.findT[i] = g.t;
            emit(g, { k: 'find', a: L.finds[i].id, p: f });
        }
    }
    for (let i = 0; i < L.forks.length; i++) {
        if (g.forks[i]) continue;
        const f = L.forks[i];
        if (Math.abs(f.p[1] - g.p[1]) < 1.5 && Math.hypot(f.p[0] - cx, f.p[2] - cz) < f.r) {
            g.forks[i] = true;
            g.valg++;
            emit(g, { k: 'fork', a: f.name });
        }
    }
    for (let i = 0; i < L.intros.length; i++) {
        if (g.intros[i]) continue;
        const f = L.intros[i];
        if (Math.abs(f.p[1] - g.p[1]) < 1.5 && Math.hypot(f.p[0] - cx, f.p[2] - cz) < f.r) {
            g.intros[i] = true;
            emit(g, { k: 'intro', a: f.key, p: f.p });
        }
    }
}

const PP: V3 = [0, 0, 0];
const AHEAD: V3 = [0, 0, 0];
function pope(g: G, dt: number) {
    const L = g.L;
    // Stigende slam: paven blir hjemme.
    if (g.ch === 'slam') return;
    if (!g.popeActive) {
        if (g.t < L.popeStart) return;
        g.popeActive = true;
        g.popeS = 0;
    }
    // Paven går mot der du er på den trygge stien, aldri ut på tau eller planker.
    const target = projectOnPath(L, g.p);
    const dir = Math.sign(target - g.popeS);
    pathPoint(L, g.popeS, PP);
    // Fart: loddrett (stiger) går tregere.
    pathPoint(L, g.popeS + dir * 0.2, AHEAD);
    const vert = Math.abs(AHEAD[1] - PP[1]) / 0.2;
    const sp0 = vert > 0.7 ? L.popeClimb : PP[1] > POPE_HIGH_Y ? L.popeHigh : L.popeSpeed;
    const sp = sp0 * popePace(g);
    const stepS = sp * dt;
    const there = Math.abs(target - g.popeS) <= stepS;
    if (there) g.popeS = target;
    else g.popeS += dir * stepS;
    pathPoint(L, g.popeS, g.pope);
    // Står du på samme gulv eller bjelke like ved stien hans, går han bort til deg.
    const ox = g.p[0] - g.pope[0];
    const oz = g.p[2] - g.pope[2];
    const hd = Math.hypot(ox, oz);
    if (there && g.mode === 'ground' && Math.abs(g.p[1] - g.pope[1]) < 1.2 && hd < 9)
        g.popeOff = Math.min(hd, g.popeOff + stepS);
    else g.popeOff = Math.max(0, g.popeOff - stepS * 2);
    if (g.popeOff > 0 && hd > 1e-3) {
        const k = Math.min(g.popeOff, hd) / hd;
        g.pope[0] += ox * k;
        g.pope[2] += oz * k;
    }
    if (g.mode === 'spill' || g.ended) return;
    const d = Math.hypot(g.pope[0] - g.p[0], (g.pope[1] - g.p[1]) * 1.0, g.pope[2] - g.p[2]);
    if (d < g.popeMin) g.popeMin = d;
    if (d < POPE_REACH) end(g, 'tapt', 'paven');
    else if (d < POPE_NEAR && !g.popeClose) {
        g.popeClose = true;
        nearMiss(g, 'pave', false);
    } else if (g.popeClose && d > POPE_NEAR + 2) {
        // Slapp unna paven: på hengende håret.
        g.popeClose = false;
        nearMiss(g, 'pave-unna', true);
    }
}

/** Paven: raskere mot den som står og nøler (over 1,5 s), roligere når du går jevnt fram. */
export const POPE_IDLE = 1.5;
export const POPE_FAST = 1.8;
export const POPE_CALM = 0.8;
export function popePace(g: G) {
    if (g.still > POPE_IDLE) return POPE_FAST;
    return g.still === 0 ? POPE_CALM : 1;
}

/** Utfordringen «Stigende slam»: kalkslammet stiger fra gulvet, raskere etter hvert sjekkpunkt. */
function slam(g: G, dt: number) {
    const [base, per] = g.L.slam;
    g.slam += (base + per * g.cp) * dt;
    if (g.mode !== 'spill' && g.slam > g.p[1] + 0.4) end(g, 'tapt', 'slam');
}

// ---------------------------------------------------------------------------
// Tall til HUD og selvspill
// ---------------------------------------------------------------------------

export function popeDistance(g: G) {
    if (!g.popeActive) return 99;
    return Math.hypot(g.pope[0] - g.p[0], g.pope[1] - g.p[1], g.pope[2] - g.p[2]);
}

/**
 * Hvor lenge panikken (rød kant, hjertebank) varer på slutten av en etappe: 6 s, eller 25 % på
 * en kort etappe. Ni sekunder med pulserende rødt gjorde at spillet føltes kaotisk lenge før
 * det var reell fare.
 */
export function panicLen(g: G) {
    return Math.min(6, g.etLen * 0.25);
}

/**
 * Presset (0-1): etappe-klokka (en sagtann: stiger mot hvert kalkkar, bratt i panikken), høyden
 * (et søl der oppe koster mest) og paven eller slammet like bak.
 */
export function pressure(g: G) {
    const prog = Math.max(0, Math.min(1, g.p[1] / g.L.goalY));
    const ef = Math.min(1, g.etT / g.etLen);
    const left = Math.max(0, g.etLen - g.etT);
    const clock = 0.4 * ef + 0.15 * ef * ef + (left < panicLen(g) ? 0.15 : 0);
    const pope = g.popeActive ? Math.max(0, 1 - popeDistance(g) / 14) : 0;
    const sl = g.ch === 'slam' ? Math.max(0, 1 - (g.p[1] - g.slam) / 6) : 0;
    return Math.min(1, 0.2 + 0.3 * prog + clock + 0.35 * Math.max(pope, sl));
}

/** Etappe-klokka: 'frisk', 'sprekker' (siste 35 %) eller 'panikk' (siste 6 s). */
export function clockPhase(g: G): 'frisk' | 'sprekker' | 'panikk' {
    const left = Math.max(0, g.etLen - g.etT);
    return left < panicLen(g) ? 'panikk' : left < g.etLen * 0.35 ? 'sprekker' : 'frisk';
}

export function progress(g: G) {
    if (g.ended === 'vunnet') return 1;
    return Math.max(0, Math.min(1, g.maxY / g.L.goalY));
}

export function findsCount(g: G) {
    return g.finds.filter(Boolean).length;
}

export function totalSpills(g: G) {
    return Object.values(g.spills).reduce((a, b) => a + b, 0);
}

export function finalScore(g: G) {
    const f = findsCount(g) * 250;
    const k = CHALLENGE_BONUS[g.ch];
    if (g.ended === 'vunnet') return Math.max(0, Math.round((1000 + f + g.bonus) * k));
    return Math.max(0, Math.round((Math.round(progress(g) * 500) + f + g.bonus) * k));
}

export function stars(g: G) {
    return [g.ended === 'vunnet', g.finds.every(Boolean), g.ended === 'vunnet' && g.t < g.L.target];
}

/**
 * Hvor bøtta skal nå: neste kalkkar (som Checkpoints i world.tsx tegner det), eller mesteren.
 * Står kalkkaret på toppen av en stige og du er under, er målet foten av stigen: det er neste
 * steg du faktisk kan se fra gulvet.
 */
export function nextGoal(g: G): V3 {
    const L = g.L;
    const next = L.checkpoints[g.cp + 1];
    if (!next) return L.master.p;
    if (g.mode !== 'ladder') {
        for (const ld of L.ladders) {
            const topX = ld.x + ld.exit[0];
            const topZ = ld.z + ld.exit[1];
            if (Math.abs(ld.y1 - next.p[1]) > 1 || Math.hypot(topX - next.p[0], topZ - next.p[2]) > 3.5) continue;
            if (g.p[1] < ld.y1 - 1.5 && g.p[1] > ld.y0 - 1.5) return [ld.x + ld.n[0] * 0.6, ld.y0, ld.z + ld.n[1] * 0.6];
        }
    }
    const side = L.mirror ? -1 : 1;
    const wz = next.p[2] > 0 ? 0.2 : -0.2;
    return [next.p[0] + 1.45 * side, next.p[1], next.p[2] + wz * 1.5];
}

/** Sekunder igjen på etappe-klokka. */
export function clockLeft(g: G) {
    return Math.max(0, g.etLen - g.etT);
}

export function drainEvents(g: G): Ev[] {
    if (!g.ev.length) return EMPTY;
    const out = g.ev;
    g.ev = [];
    return out;
}
const EMPTY: Ev[] = [];
