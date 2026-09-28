// SPØKELSESHÆREN - spillreglene. Ren TypeScript uten React, så robotene kan
// spille tusenvis av runder i simuleringen (npx tsx) uten nettleser.
//
// Fagkjernen: Tyskland trodde det flybildene viste. En stor hær ved Dover og tomme
// havner i Portsmouth betydde angrep ved Calais - og da ble reservene stående der.
// Et ekte skip, en slapp gummitank eller et tomt jorde på et bilde svinger pila på
// Rommels kart mot Normandie. Når den peker dit, ruller reservene.

export const W = 1600;
export const H = 900;

/** Dager fra 15. mai 1944. D-dagen er dag 22, seier 25. juli er dag 71. */
export const DDAY = 22;
export const STORM_DAY = 35;
/**
 * Forsterkningene: fra tre dager etter D-dagen seilte nye tropper og forsyninger fra
 * havnene i Sør-England til Normandie hver dag. Så tyskerne mange skip i Portsmouth,
 * var det et bevis på hvor hovedangrepet gikk - så de måtte skjules like godt som flåten.
 */
export const REINFORCE_DAY = DDAY + 3;
export const END_DAY = 71;
/** Sekunder per dag før og etter D-dagen. Første del er kortere per dag. */
const SEC_PER_DAY_A = 2.5;
const SEC_PER_DAY_B = 1.7;
export const RUN_SECONDS = DDAY * SEC_PER_DAY_A + (END_DAY - DDAY) * SEC_PER_DAY_B;

// Pumping
export const PUMP_RATE = 0.62; // fylling per sekund
export const OK_MIN = 0.66;
export const BURST = 1.14;
const AIR_PER_FILL = 0.72;
const AIR_REGEN = 0.35;
// Tankene lekker fort nok til at en full tank bare holder seg stiv i rundt 9 sekunder.
// Da lønner det seg ikke å fylle hele Dover med tanker og vente: eleven må lese
// flyrutene og fylle akkurat de tankene kameraet skal fotografere, rett før det kommer.
export const LEAK = 0.016;
export const TANK_R = 36;

// Nett og skip
export const NET_R = 92;
export const MAX_SHIPS = 11;

// Kameraruter
export const FRAME_W = 210;
export const FRAME_H = 150;

export const DOVER = { x0: 1000, x1: 1530, y0: 130, y1: 600 };
export const PORTS = { x0: 40, x1: 700, y0: 420, y1: 760 };
export const LONDON = { x: 790, y: 190 };

export type Cause = 'skip' | 'gummi' | 'tomt';
export type Mode = 'play' | 'won' | 'lost';

export interface Tank {
    id: number;
    x: number;
    y: number;
    fill: number;
    pumping: boolean;
    burst: number; // > 0: sprukket, teller ned til den forsvinner
    wobble: number;
    wasOk: boolean;
}

export interface Ship {
    id: number;
    slot: number;
    x: number;
    y: number;
    rot: number;
    arrive: number; // 0-1 innseiling
    leaving: number; // > 0: seiler ut 6. juni
    /** Forsterkninger: sekunder til skipet seiler til Normandie. Infinity før D-dagen. */
    stay: number;
    len: number;
}

export interface Net {
    x: number;
    y: number;
    dragging: boolean;
}

export interface Frame {
    x: number;
    y: number;
    taken: boolean;
    /** Resultatet, for tegning: 'bra' | 'ok' | 'mistanke' | 'noytral' */
    verdict: '' | 'bra' | 'ok' | 'mistanke' | 'noytral';
    marks: { x: number; y: number; r: number; label: string }[];
    shownFor: number;
}

export interface Plane {
    id: number;
    x0: number;
    y0: number;
    dx: number;
    dy: number;
    s: number; // distanse fløyet
    len: number;
    speed: number;
    warn: number; // sekunder til flyet kommer inn (ruta vises)
    frames: Frame[];
    target: 'dover' | 'ports' | 'midt';
}

export interface Telegram {
    life: number; // sekunder igjen
    x: number;
    y: number;
}

export interface Fx {
    kind: 'flash' | 'pop' | 'puff' | 'text';
    x: number;
    y: number;
    t: number;
    life: number;
    text?: string;
    color?: string;
}

export interface Stats {
    good: number;
    bad: number;
    pumped: number;
    bursts: number;
    shipsSeen: number;
    shipsHidden: number;
    garboSent: number;
    garboOk: number;
    garboBad: number;
    bestCombo: number;
    blame: Record<Cause, number>;
}

export interface Game {
    t: number; // spilte sekunder
    day: number;
    mode: Mode;
    cause: Cause | null;
    tro: number; // 0 = Calais, 1 = Normandie
    troShown: number;
    air: number;
    tanks: Tank[];
    ships: Ship[];
    nets: Net[];
    planes: Plane[];
    telegram: Telegram | null;
    garboCheck: boolean;
    fx: Fx[];
    score: number;
    combo: number;
    valg: number;
    nextPlane: number;
    nextShip: number;
    nextTelegram: number;
    seed: number;
    ids: number;
    fleetSailed: boolean;
    /** Forsterkningene går fra havna (fra REINFORCE_DAY). */
    convoys: boolean;
    /** Siste flybilde flyttet Rommels pil så mye (for rykket på kartet), og hvor lenge siden. */
    kick: { d: number; t: number };
    stormOn: boolean;
    flip: boolean;
    stats: Stats;
    /** Pekeren: hva eleven holder i akkurat nå. */
    hold: { kind: 'none' | 'tank' | 'net'; id: number; autoRelease: number | null };
    /** Hendelser siden sist, for lyd og tekst i komponenten. */
    events: GameEvent[];
    lastBlame: Cause | null;
}

export type GameEvent =
    | {
          e: 'photo';
          verdict: Frame['verdict'];
          x: number;
          y: number;
          zone: 'dover' | 'ports' | 'midt';
      }
    | { e: 'caught'; cause: Cause; x: number; y: number }
    | { e: 'burst'; x: number; y: number }
    | { e: 'ok'; x: number; y: number }
    | { e: 'slapp'; x: number; y: number }
    | { e: 'ship'; x: number; y: number }
    | { e: 'plane'; x: number; y: number }
    | { e: 'dday' }
    | { e: 'convoys' }
    | { e: 'storm' }
    | { e: 'telegram'; x: number; y: number }
    | { e: 'garbo'; ok: boolean | null }
    | { e: 'points'; n: number; x: number; y: number }
    | { e: 'won' }
    | { e: 'lost'; cause: Cause };

// ---------------------------------------------------------------------------
// Tilfeldighet og geometri
// ---------------------------------------------------------------------------

export function rand(g: { seed: number }) {
    g.seed = (g.seed * 1664525 + 1013904223) >>> 0;
    return g.seed / 4294967296;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Kystlinja: y for land/hav-grensen ved x. Over (mindre y) er land. */
export function coastY(x: number) {
    // Solent-bukta i vest, rett kyst i midten, hvite klipper ved Dover i øst.
    let y = 585 + 18 * Math.sin(x / 120) + 10 * Math.sin(x / 37 + 1.3);
    if (x < 700) y -= 70 * Math.exp(-(((x - 340) / 230) ** 2)); // Portsmouth-bukta
    if (x > 1180) y -= 30 * ((x - 1180) / 420); // Dover-klippene
    return y;
}

export function isLand(x: number, y: number) {
    return y < coastY(x) - 6;
}

export function inDover(x: number, y: number) {
    return x > DOVER.x0 && x < DOVER.x1 && y > DOVER.y0 && y < DOVER.y1 && isLand(x, y);
}

export function zoneOf(x: number, y: number): 'dover' | 'ports' | 'midt' {
    if (x > DOVER.x0 - 60 && y < DOVER.y1 + 40) return 'dover';
    if (x < PORTS.x1 && y > PORTS.y0 - 60) return 'ports';
    return 'midt';
}

/** Havneplassene i Portsmouth: fire klynger på vannet innerst i bukta. */
export const SLOTS: [number, number, number][] = (() => {
    const clusters: [number, number][] = [
        [150, 640],
        [300, 585],
        [455, 620],
        [600, 665],
    ];
    const out: [number, number, number][] = [];
    const offs = [
        [-34, -14, 0.25],
        [30, 10, 0.2],
        [-6, 38, 0.3],
    ];
    clusters.forEach(([cx, cy], ci) => {
        for (let k = 0; k < 3; k++) {
            if (ci === 3 && k === 2) continue;
            const [ox, oy, r] = offs[k];
            out.push([cx + ox, cy + oy, r + ci * 0.05]);
        }
    });
    return out;
})();

// ---------------------------------------------------------------------------
// Ny runde
// ---------------------------------------------------------------------------

export function newGame(seed: number): Game {
    return {
        t: 0,
        day: 0,
        mode: 'play',
        cause: null,
        tro: 0.15,
        troShown: 0.15,
        air: 1,
        tanks: [],
        ships: [],
        nets: [
            // Nettene ligger sammenrullet på land til eleven drar dem ut.
            { x: 250, y: 440, dragging: false },
            { x: 400, y: 425, dragging: false },
            { x: 550, y: 450, dragging: false },
        ],
        planes: [],
        telegram: null,
        garboCheck: false,
        fx: [],
        score: 0,
        combo: 0,
        valg: 0,
        nextPlane: 2.2,
        nextShip: 5,
        nextTelegram: 6,
        seed: seed >>> 0 || 1,
        ids: 1,
        fleetSailed: false,
        convoys: false,
        kick: { d: 0, t: 9 },
        stormOn: false,
        flip: false,
        stats: {
            good: 0,
            bad: 0,
            pumped: 0,
            bursts: 0,
            shipsSeen: 0,
            shipsHidden: 0,
            garboSent: 0,
            garboOk: 0,
            garboBad: 0,
            bestCombo: 0,
            blame: { skip: 0, gummi: 0, tomt: 0 },
        },
        hold: { kind: 'none', id: 0, autoRelease: null },
        events: [],
        lastBlame: null,
    };
}

export function dayAt(t: number) {
    const tA = DDAY * SEC_PER_DAY_A;
    return t < tA ? t / SEC_PER_DAY_A : DDAY + (t - tA) / SEC_PER_DAY_B;
}

/** Hvor hardt spillet presser nå (0-1): flyfrekvens, fart og drift mot Normandie. */
export function pressure(g: Game) {
    const rate = 1 / planeGap(g);
    const drift = driftRate(g);
    const leak = g.stormOn ? 1 : 0.35;
    return clamp(
        0.08 + 0.42 * clamp(rate / 0.36, 0, 1) + 0.35 * clamp(drift / 0.015, 0, 1) + 0.15 * leak,
        0,
        1
    );
}

export const mult = (g: Game) => 1 + Math.min(4, Math.floor(g.combo / 3));

// ---------------------------------------------------------------------------
// Tempo og eskalering
// ---------------------------------------------------------------------------

function planeGap(g: Game) {
    const d = g.day;
    if (d < DDAY) return 7.2 - (d / DDAY) * 2.2; // 7,2 -> 5 s
    return clamp(5.2 - ((d - DDAY) / (END_DAY - DDAY)) * 2.6, 2.6, 5.2); // 5,2 -> 2,6 s
}

function planeSpeed(g: Game) {
    return 150 + (g.day / END_DAY) * 85;
}

function driftRate(g: Game) {
    if (g.day < DDAY) return 0.002 + (g.day / DDAY) * 0.004; // tvilen vokser mot juni
    // Etter D-dagen er selve invasjonen et bevis som trekker mot Normandie.
    return 0.014 + ((g.day - DDAY) / (END_DAY - DDAY)) * 0.0085;
}

function shipGap(g: Game) {
    if (g.convoys) return 3.4;
    return 5.2 - (g.day / DDAY) * 2.4;
}

// ---------------------------------------------------------------------------
// Input: samme grep for eleven og robotene
// ---------------------------------------------------------------------------

export function tankAt(g: Game, x: number, y: number, r = TANK_R + 10) {
    let best: Tank | null = null;
    let bd = r * r;
    for (const t of g.tanks) {
        if (t.burst !== 0) continue;
        const d = (t.x - x) ** 2 + (t.y - y) ** 2;
        if (d < bd) {
            bd = d;
            best = t;
        }
    }
    return best;
}

export function netAt(g: Game, x: number, y: number) {
    if (g.fleetSailed) return -1;
    let best = -1;
    let bd = (NET_R * 0.75) ** 2;
    g.nets.forEach((n, i) => {
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < bd) {
            bd = d;
            best = i;
        }
    });
    return best;
}

export function telegramAt(g: Game, x: number, y: number) {
    const tg = g.telegram;
    return !!tg && Math.abs(x - tg.x) < 70 && Math.abs(y - tg.y) < 50;
}

/**
 * Trykk ned på flybildet. Returnerer hva som skjedde, så komponenten kan gi
 * tilbakemelding når eleven trykker et sted uten virkning.
 */
export function press(
    g: Game,
    x: number,
    y: number,
    autoRelease: number | null = null
): 'nett' | 'tank' | 'ny' | 'garbo' | 'luft' | 'trangt' | 'ingen' {
    if (g.mode !== 'play') return 'ingen';
    release(g);
    if (telegramAt(g, x, y)) {
        sendGarbo(g);
        return 'garbo';
    }
    const ni = netAt(g, x, y);
    if (ni >= 0) {
        g.nets[ni].dragging = true;
        g.hold = { kind: 'net', id: ni, autoRelease: null };
        return 'nett';
    }
    const t = tankAt(g, x, y);
    if (t) {
        if (g.air < 0.05) return 'luft';
        t.pumping = true;
        g.hold = { kind: 'tank', id: t.id, autoRelease };
        return 'tank';
    }
    if (inDover(x, y)) {
        if (g.air < 0.08) return 'luft';
        if (tankAt(g, x, y, TANK_R * 1.7)) return 'trangt';
        const nt: Tank = {
            id: g.ids++,
            x,
            y,
            fill: 0,
            pumping: true,
            burst: 0,
            wobble: 0,
            wasOk: false,
        };
        g.tanks.push(nt);
        g.hold = { kind: 'tank', id: nt.id, autoRelease };
        return 'ny';
    }
    return 'ingen';
}

export function move(g: Game, x: number, y: number) {
    if (g.hold.kind === 'net') {
        const n = g.nets[g.hold.id];
        if (n) {
            n.x = clamp(x, 40, 760);
            n.y = clamp(y, 380, 800);
        }
    }
}

export function release(g: Game) {
    if (g.hold.kind === 'tank') {
        const t = g.tanks.find((k) => k.id === g.hold.id);
        if (t && t.pumping) {
            t.pumping = false;
            if (t.burst === 0) {
                if (t.fill >= OK_MIN) {
                    if (!t.wasOk) g.stats.pumped++;
                    t.wasOk = true;
                    g.events.push({ e: 'ok', x: t.x, y: t.y });
                } else g.events.push({ e: 'slapp', x: t.x, y: t.y });
            }
        }
    } else if (g.hold.kind === 'net') {
        const n = g.nets[g.hold.id];
        if (n) n.dragging = false;
    }
    g.hold = { kind: 'none', id: 0, autoRelease: null };
}

export function sendGarbo(g: Game) {
    if (!g.telegram) return;
    g.telegram = null;
    g.tro = clamp(g.tro - 0.14, 0, 1);
    g.garboCheck = true;
    g.stats.garboSent++;
    g.events.push({ e: 'garbo', ok: null });
}

// ---------------------------------------------------------------------------
// Bildene
// ---------------------------------------------------------------------------

function inFrame(f: Frame, x: number, y: number, pad = 0) {
    return Math.abs(x - f.x) < FRAME_W / 2 + pad && Math.abs(y - f.y) < FRAME_H / 2 + pad;
}

export function shipCovered(g: Game, s: Ship) {
    if (g.fleetSailed) return false;
    return g.nets.some((n) => !n.dragging && (n.x - s.x) ** 2 + (n.y - s.y) ** 2 < NET_R * NET_R);
}

function blame(g: Game, c: Cause, amount: number) {
    g.stats.blame[c] += amount;
    g.lastBlame = c;
}

function takePhoto(g: Game, f: Frame, p: Plane) {
    f.taken = true;
    f.shownFor = 2.6;
    const zone = zoneOf(f.x, f.y);
    let d = 0;
    let pts = 0;
    if (zone === 'dover') {
        let stiff = 0;
        let slapp = 0;
        for (const t of g.tanks) {
            if (!inFrame(f, t.x, t.y, 4)) continue;
            if (t.burst > 0) {
                slapp++;
                f.marks.push({ x: t.x, y: t.y, r: 30, label: 'GUMMI?' });
            } else if (t.fill >= OK_MIN && t.fill < BURST) stiff++;
            else if (t.fill > 0.12) {
                slapp++;
                f.marks.push({ x: t.x, y: t.y, r: 30, label: 'GUMMI?' });
            }
        }
        const dz = f.x > DOVER.x0 - 20 && f.x < DOVER.x1 + 20 && f.y > DOVER.y0 - 20;
        if (slapp > 0) {
            d = 0.05 * slapp;
            blame(g, 'gummi', d);
            f.verdict = 'mistanke';
        } else if (stiff >= 2) {
            d = -0.055 - 0.008 * Math.min(4, stiff - 2);
            pts = 12 * stiff;
            f.verdict = 'bra';
        } else if (stiff === 1) {
            d = -0.012;
            pts = 8;
            f.verdict = 'ok';
        } else if (dz) {
            d = 0.045;
            blame(g, 'tomt', d);
            f.verdict = 'mistanke';
            f.marks.push({ x: f.x, y: f.y, r: 44, label: 'TOMT' });
        } else f.verdict = 'noytral';
        if (g.garboCheck && f.verdict !== 'noytral') {
            g.garboCheck = false;
            const ok = f.verdict === 'bra';
            if (ok) {
                d -= 0.06;
                pts += 120;
                g.stats.garboOk++;
            } else {
                d += 0.12;
                g.stats.garboBad++;
                blame(g, f.verdict === 'mistanke' && slapp > 0 ? 'gummi' : 'tomt', 0.12);
            }
            g.events.push({ e: 'garbo', ok });
        }
    } else if (zone === 'ports') {
        let seen = 0;
        let hidden = 0;
        for (const s of g.ships) {
            if (s.leaving > 0 || s.arrive < 0.6) continue;
            if (!inFrame(f, s.x, s.y, 6)) continue;
            if (shipCovered(g, s)) hidden++;
            else {
                seen++;
                f.marks.push({ x: s.x, y: s.y, r: 34, label: 'SKIP!' });
            }
        }
        g.stats.shipsSeen += seen;
        g.stats.shipsHidden += hidden;
        if (seen > 0) {
            // Ett skip kan være en tilfeldighet. To på samme bilde er en flåte,
            // og tre er beviset: da vet tyskerne hvor invasjonen skal gå fra.
            d = seen >= 3 ? 0.5 : seen >= 2 ? 0.17 * seen : 0.13;
            blame(g, 'skip', d);
            f.verdict = 'mistanke';
        } else if (hidden > 0) {
            d = -0.012;
            pts = 10 * hidden;
            f.verdict = 'bra';
        } else f.verdict = 'noytral';
    } else f.verdict = 'noytral';

    if (f.verdict === 'mistanke') {
        g.combo = 0;
        g.stats.bad++;
        const m = f.marks[0];
        g.events.push({
            e: 'caught',
            cause: g.lastBlame ?? 'tomt',
            x: m ? m.x : f.x,
            y: m ? m.y : f.y,
        });
    } else if (f.verdict === 'bra' || f.verdict === 'ok') {
        g.combo++;
        g.stats.good++;
        g.stats.bestCombo = Math.max(g.stats.bestCombo, g.combo);
    }
    if (pts > 0) {
        const n = pts * mult(g);
        g.score += n;
        g.events.push({ e: 'points', n, x: f.x, y: f.y - FRAME_H / 2 });
    }
    g.tro = clamp(g.tro + d, 0, 1);
    if (d !== 0) g.kick = { d, t: 0 };
    g.events.push({ e: 'photo', verdict: f.verdict, x: f.x, y: f.y, zone });
    g.fx.push({ kind: 'flash', x: f.x, y: f.y, t: 0, life: 0.35 });
    void p;
}

// ---------------------------------------------------------------------------
// Fly, skip og telegram
// ---------------------------------------------------------------------------

function spawnPlane(g: Game) {
    const r = rand(g);
    let target: Plane['target'];
    // Før D-dagen veksler flyene mellom Dover og Portsmouth: tyskerne lette etter
    // begge hærene. Etter D-dagen ser de mest etter hæren ved Dover.
    const docked = g.ships.filter((s) => s.leaving === 0);
    if (g.t < 4)
        target = 'dover'; // første fly: rett over Dover, så eleven lærer pumpingen først
    else if (!g.fleetSailed) {
        g.flip = !g.flip;
        target = g.flip && docked.length ? 'ports' : r < 0.12 ? 'midt' : 'dover';
    } else target = r < 0.8 ? 'dover' : r < 0.9 ? 'ports' : 'midt';
    // Flyet sikter mot et punkt: et sted ved Dover, et skip i Portsmouth, eller midt i landet.
    let ax: number;
    let ay: number;
    if (target === 'dover') {
        ax = DOVER.x0 + 70 + rand(g) * (DOVER.x1 - DOVER.x0 - 140);
        ay = 300 + rand(g) * 160;
    } else if (target === 'ports' && docked.length) {
        const s = docked[Math.floor(rand(g) * docked.length)];
        ax = s.x + (rand(g) - 0.5) * 40;
        ay = s.y;
    } else if (target === 'ports') {
        ax = 120 + rand(g) * 500;
        ay = 620;
    } else {
        ax = 740 + rand(g) * 180;
        ay = 350;
    }
    const lean = (rand(g) - 0.5) * 0.5; // dx per dy
    const y0 = H + 160;
    const y1 = -120;
    const x0 = ax + lean * (y0 - ay);
    const x1 = ax + lean * (y1 - ay);
    const len = Math.hypot(x1 - x0, y1 - y0);
    const p: Plane = {
        id: g.ids++,
        x0,
        y0,
        dx: (x1 - x0) / len,
        dy: (y1 - y0) / len,
        s: 0,
        len,
        speed: planeSpeed(g),
        warn: 2.2,
        frames: [],
        target,
    };
    // Kameraet tar bilder over land (og havna) med jevne mellomrom.
    const step = FRAME_H - 4;
    for (let s = 0; s < len; s += 8) {
        const x = x0 + p.dx * s;
        const y = y0 + p.dy * s;
        if (y > 780 || y < 90) continue;
        const z = zoneOf(x, y);
        const onLand = isLand(x, y);
        const harbour = z === 'ports' && !g.fleetSailed;
        if (!onLand && !harbour) continue;
        const last = p.frames[p.frames.length - 1];
        if (last && Math.hypot(last.x - x, last.y - y) < step) continue;
        p.frames.push({ x, y, taken: false, verdict: '', marks: [], shownFor: 0 });
        if (p.frames.length >= 3) break;
    }
    g.planes.push(p);
    g.valg++;
    g.events.push({ e: 'plane', x: p.frames[0]?.x ?? ax, y: p.frames[0]?.y ?? ay });
}

export function planePos(p: Plane) {
    return { x: p.x0 + p.dx * p.s, y: p.y0 + p.dy * p.s };
}

function spawnShip(g: Game) {
    const free = SLOTS.map((_, i) => i).filter((i) => !g.ships.some((s) => s.slot === i));
    if (!free.length) return;
    const slot = free[Math.floor(rand(g) * free.length)];
    const [x, y, rot] = SLOTS[slot];
    const stay = g.convoys ? 13 + rand(g) * 7 : Infinity;
    const s: Ship = {
        id: g.ids++,
        slot,
        x,
        y,
        rot,
        arrive: 0,
        leaving: 0,
        len: 44 + rand(g) * 12,
        stay,
    };
    g.ships.push(s);
    g.valg++;
    g.events.push({ e: 'ship', x, y });
}

// ---------------------------------------------------------------------------
// Ett steg
// ---------------------------------------------------------------------------

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') {
        tickFx(g, dt);
        return;
    }
    g.t += dt;
    const prevDay = g.day;
    g.day = dayAt(g.t);

    // Hver dag bløffen holder, er verdt poeng - mer etter D-dagen, da hver dag
    // tyskerne venter ved Calais, er en dag brohodet i Normandie får vokse.
    if (Math.floor(g.day) > Math.floor(prevDay)) g.score += g.day >= DDAY ? 30 : 15;

    // Hendelser i kalenderen
    if (prevDay < DDAY && g.day >= DDAY) {
        g.fleetSailed = true;
        for (const s of g.ships) s.leaving = 0.001;
        for (const n of g.nets) n.dragging = false;
        if (g.hold.kind === 'net') release(g);
        g.tro = clamp(g.tro + 0.06, 0, 1);
        g.nextTelegram = 5;
        g.events.push({ e: 'dday' });
    }
    if (prevDay < REINFORCE_DAY && g.day >= REINFORCE_DAY) {
        g.fleetSailed = false;
        g.convoys = true;
        g.nextShip = 1.5;
        g.events.push({ e: 'convoys' });
    }
    if (prevDay < STORM_DAY && g.day >= STORM_DAY) {
        g.stormOn = true;
        g.nextPlane = Math.max(g.nextPlane, 4.5);
        g.events.push({ e: 'storm' });
    }
    if (g.stormOn && g.day > STORM_DAY + 5) g.stormOn = false;

    // Drift: tyskerne tviler hele tiden, og etter D-dagen er invasjonen et bevis i seg selv.
    g.tro = clamp(g.tro + driftRate(g) * dt, 0, 1);

    // Luft
    let pumping = 0;
    for (const t of g.tanks) if (t.pumping && t.burst === 0) pumping++;
    if (pumping === 0) g.air = clamp(g.air + AIR_REGEN * dt, 0, 1);

    // Tanker
    const leak = LEAK * (g.stormOn ? 2.4 : 1);
    for (const t of g.tanks) {
        t.wobble = Math.max(0, t.wobble - dt * 2);
        if (t.burst > 0) {
            t.burst -= dt;
            if (t.burst <= 0) t.burst = -1;
            continue;
        }
        if (t.burst < 0) continue;
        if (t.pumping) {
            const use = PUMP_RATE * AIR_PER_FILL * dt;
            if (g.air <= 0) {
                release(g);
                continue;
            }
            g.air = clamp(g.air - use, 0, 1);
            t.fill += PUMP_RATE * dt;
            t.wobble = 1;
            if (
                g.hold.kind === 'tank' &&
                g.hold.id === t.id &&
                g.hold.autoRelease !== null &&
                t.fill >= g.hold.autoRelease
            )
                release(g);
            else if (t.fill >= BURST) {
                t.pumping = false;
                t.burst = 3.5;
                t.fill = 0;
                g.stats.bursts++;
                if (g.hold.kind === 'tank' && g.hold.id === t.id)
                    g.hold = { kind: 'none', id: 0, autoRelease: null };
                g.events.push({ e: 'burst', x: t.x, y: t.y });
            }
        } else if (t.fill > 0) {
            const was = t.fill >= OK_MIN;
            t.fill = Math.max(0.2, t.fill - leak * dt);
            if (was && t.fill < OK_MIN) {
                // En tank som blir slapp, er et nytt valg: fylle på, eller la den være?
                g.valg++;
                g.events.push({ e: 'slapp', x: t.x, y: t.y });
            }
        }
    }
    g.tanks = g.tanks.filter((t) => t.burst >= 0);

    // Skip
    if (!g.fleetSailed) {
        g.nextShip -= dt;
        if (g.nextShip <= 0 && g.ships.length < MAX_SHIPS) {
            spawnShip(g);
            g.nextShip = shipGap(g);
        }
    }
    for (const s of g.ships) {
        s.arrive = Math.min(1, s.arrive + dt * 0.6);
        if (s.leaving > 0) s.leaving += dt;
        else if (g.convoys && s.arrive >= 1) {
            s.stay -= dt;
            if (s.stay <= 0) s.leaving = 0.001; // konvoien går til Normandie
        }
    }
    g.ships = g.ships.filter((s) => s.leaving < 6);

    // Fly
    g.nextPlane -= dt;
    if (g.nextPlane <= 0) {
        spawnPlane(g);
        let gap = planeGap(g);
        if (g.stormOn) gap *= 1.3;
        g.nextPlane = gap * (0.85 + rand(g) * 0.3);
        // Sent i runden: av og til to fly samtidig.
        if (g.day > DDAY + 18 && rand(g) < 0.35) spawnPlane(g);
    }
    for (const p of g.planes) {
        if (p.warn > 0) {
            p.warn -= dt;
            continue;
        }
        p.s += p.speed * dt;
        const pos = planePos(p);
        for (const f of p.frames) {
            if (!f.taken && pos.y <= f.y) takePhoto(g, f, p);
            if (f.taken) f.shownFor -= dt;
        }
    }
    g.planes = g.planes.filter((p) => p.s < p.len || p.frames.some((f) => f.shownFor > 0));

    // Garbos telegram (etter D-dagen)
    if (g.day >= DDAY) {
        if (g.telegram) {
            g.telegram.life -= dt;
            if (g.telegram.life <= 0) g.telegram = null;
        } else {
            g.nextTelegram -= dt;
            if (g.nextTelegram <= 0) {
                g.telegram = { life: 11, x: LONDON.x, y: LONDON.y + 20 };
                g.nextTelegram = 16 + rand(g) * 6;
                g.valg++;
                g.events.push({ e: 'telegram', x: LONDON.x, y: LONDON.y + 20 });
            }
        }
    }

    g.troShown += (g.tro - g.troShown) * Math.min(1, dt * 4);
    g.kick.t += dt;
    tickFx(g, dt);

    // Utfall
    if (g.tro >= 1) {
        g.mode = 'lost';
        const b = g.stats.blame;
        // Årsaken er det som veide tyngst gjennom runden, ikke bare det siste bildet.
        g.cause =
            b.skip >= b.gummi && b.skip >= b.tomt ? 'skip' : b.gummi >= b.tomt ? 'gummi' : 'tomt';
        release(g);
        g.events.push({ e: 'lost', cause: g.cause });
    } else if (g.day >= END_DAY) {
        g.mode = 'won';
        g.day = END_DAY;
        release(g);
        g.score += 1500;
        g.events.push({ e: 'won' });
    }
}

function tickFx(g: Game, dt: number) {
    for (const f of g.fx) f.t += dt;
    g.fx = g.fx.filter((f) => f.t < f.life);
}

/** Kameraruter som ennå ikke er tatt, med sekunder til kameraet kommer. */
export function upcomingFrames(g: Game) {
    const out: { f: Frame; p: Plane; eta: number }[] = [];
    for (const p of g.planes) {
        const pos = planePos(p);
        for (const f of p.frames) {
            if (f.taken) continue;
            const dist = (pos.y - f.y) / -p.dy;
            out.push({ f, p, eta: p.warn + Math.max(0, dist) / p.speed });
        }
    }
    return out.sort((a, b) => a.eta - b.eta);
}

export function dateLabel(day: number) {
    const d = Math.floor(day);
    const months: [string, number][] = [
        ['mai', 31],
        ['juni', 30],
        ['juli', 31],
    ];
    let n = 15 + d;
    for (const [m, len] of months) {
        if (n <= len) return `${n}. ${m}`;
        n -= len;
    }
    return `${n}. august`;
}
