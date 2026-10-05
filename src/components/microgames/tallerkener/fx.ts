// Visningstilstanden: alt som beveger seg uten å være spillregler. Mynter som flyr til kista,
// tallerkener som faller og knuses, stenger som heises til snorloftet, sider som går inn og ut,
// skottenes hånd, gullsekker, lyn og rysting. Reglene (game.ts) vet ikke om noe av dette.

import { SLOTS } from './levels';
import { TUNING, type PlateKind } from './tuning';
import type { Game, GameEvent } from './state';
import { aarNa, inntekt } from './rules';
import {
    STAGE,
    TIN,
    W,
    chestMouth,
    hookPos,
    pagePos,
    platePos,
    poleFoot,
    type Pt,
} from './layout';
import type { Sfx } from './sfx';

export type CoinKind = 'gull' | 'hoff' | 'skott' | 'sekk' | 'skjold';

export interface Coin {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    /** Kontrollpunktet i buen. */
    cx: number;
    cy: number;
    t: number;
    dur: number;
    kind: CoinKind;
    rot: number;
}

export interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    color: string;
    size: number;
    /** Røyk stiger og vokser i stedet for å falle. */
    smoke?: boolean;
}

export interface Falling {
    kind: PlateKind;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
    k: number;
    /** Gulvet den knuses mot (null = flyr ut i kulissen). */
    floor: number | null;
    t: number;
}

export interface Hoist {
    slot: number;
    hook: number;
    kind: PlateKind | null;
    t: number;
}

export interface PageAnim {
    slot: number;
    kind: PlateKind;
    /** 0 = i kulissen, 1 = ved stanga. */
    u: number;
    side: -1 | 1;
    leaving: boolean;
}

export interface ViewState {
    /** Glansens vinkel per stang (roterer med snurret). */
    vinkel: number[];
    /** Buen eleven tegner nå. */
    spor: (Pt & { t: number })[];
    tinDrag: Pt | null;
    pageDrag: Pt | null;
    /** Ekte tid (s), ikke spilltid. */
    tid: number;
    coins: Coin[];
    sparks: Spark[];
    falling: Falling[];
    hoists: Hoist[];
    /** Hvilken krok hver tatt stang henger på. */
    hookOf: number[];
    /** Stenger som heises opp av lemmen (0-1). */
    rise: number[];
    page: PageAnim | null;
    /** Hvor tinntallerkenen er nå (glir mellom oppe, nede og foran rampen). */
    tin: Pt;
    /** Rød slingring etter en protest (s igjen) per stang. */
    protest: number[];
    /** Reddet i siste liten (s igjen) per stang. */
    reddet: number[];
    /** Rampelyset per stang: 1 = tent, 0 = slukket. */
    lamp: number[];
    /** Skottenes hånd: 0 = borte, 1 = helt inne ved kista. */
    arm: number;
    /** Stormkulissene: 0 = ute, 1 = inne. */
    stormL: number;
    stormR: number;
    lyn: number;
    lynNeste: number;
    tromme: number;
    /** Teppet: 1 = nede, 0 = oppe. */
    teppe: number;
    teppeMal: number;
    /** Rysting i ekte tid. */
    shake: number;
    /** Hit-stop i ekte tid: spillet står helt stille et øyeblikk ved en stor kombo. */
    hitstop: number;
    /** Myntregnskap per stang før neste mynt sendes. */
    acc: number[];
    accHoff: number;
    accSkott: number;
    accSekk: number;
    lastKind: (PlateKind | null)[];
    /** Kista rister og blinker når den er nesten tom. */
    kisteVarsel: number;
    /** Kista spretter når gull lander. */
    kisteSprett: number;
    /** Lysene slukner fra kantene når kista er tom (0-1). */
    morke: number;
    /** Gullstøv-buen som viser sveipet de første sekundene (0 = av). */
    demo: number;
    lav: boolean;
}

export function newView(lav: boolean): ViewState {
    const n = SLOTS.length;
    return {
        vinkel: SLOTS.map(() => 0),
        spor: [],
        tinDrag: null,
        pageDrag: null,
        tid: 0,
        coins: [],
        sparks: [],
        falling: [],
        hoists: [],
        hookOf: new Array(n).fill(-1),
        rise: new Array(n).fill(1),
        page: null,
        tin: { ...TIN.oppe },
        protest: new Array(n).fill(0),
        reddet: new Array(n).fill(0),
        lamp: new Array(n).fill(0),
        arm: 0,
        stormL: 0,
        stormR: 0,
        lyn: 0,
        lynNeste: 2,
        tromme: 0,
        teppe: 1,
        teppeMal: 1,
        shake: 0,
        hitstop: 0,
        acc: new Array(n).fill(0),
        accHoff: 0,
        accSkott: 0,
        accSekk: 0,
        lastKind: new Array(n).fill(null),
        kisteVarsel: 0,
        kisteSprett: 0,
        morke: 0,
        demo: 0,
        lav,
    };
}

const maxCoins = (v: ViewState) => (v.lav ? 70 : 170);
const maxSparks = (v: ViewState) => (v.lav ? 80 : 220);

function coin(v: ViewState, kind: CoinKind, a: Pt, b: Pt, lift: number, dur: number) {
    if (v.coins.length >= maxCoins(v)) return;
    v.coins.push({
        x0: a.x,
        y0: a.y,
        x1: b.x,
        y1: b.y,
        cx: (a.x + b.x) / 2 + (Math.random() - 0.5) * 30,
        cy: Math.min(a.y, b.y) - lift,
        t: 0,
        dur,
        kind,
        rot: Math.random() * 6,
    });
}

export function burst(v: ViewState, x: number, y: number, n: number, color: string, speed = 120, size = 2.2) {
    const k = v.lav ? 0.5 : 1;
    for (let i = 0; i < n * k && v.sparks.length < maxSparks(v); i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = speed * (0.3 + Math.random() * 0.8);
        v.sparks.push({
            x,
            y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - speed * 0.3,
            life: 0,
            max: 0.5 + Math.random() * 0.5,
            color,
            size: size * (0.6 + Math.random() * 0.8),
        });
    }
}

function smoke(v: ViewState, x: number, y: number) {
    for (let i = 0; i < (v.lav ? 4 : 9); i++)
        v.sparks.push({
            x: x + (Math.random() - 0.5) * 3,
            y,
            vx: (Math.random() - 0.5) * 8,
            vy: -20 - Math.random() * 18,
            life: -i * 0.12,
            max: 1.6,
            color: '#c9c2b0',
            size: 2,
            smoke: true,
        });
}

/** Hendelsene fra reglene blir lyd, bevegelse og partikler. */
export function onEvents(
    v: ViewState,
    g: Game,
    events: GameEvent[],
    sfx: Sfx | null,
    say: (e: GameEvent) => void
) {
    for (const e of events) {
        say(e);
        switch (e.type) {
            case 'faller': {
                const p = platePos(e.slot);
                const kind = v.lastKind[e.slot] ?? 'skip';
                const k = 1 - SLOTS[e.slot].dybde * 0.17;
                v.falling.push({ kind, x: p.x, y: p.y, vx: (Math.random() - 0.5) * 60, vy: -40, rot: 0, vr: (Math.random() - 0.5) * 6, k, floor: poleFoot(e.slot).y, t: 0 });
                sfx?.crash();
                v.shake = Math.max(v.shake, 0.25);
                break;
            }
            case 'flyr': {
                const p = platePos(e.slot);
                const kind = v.lastKind[e.slot] ?? 'skip';
                const side = p.x < W / 2 ? -1 : 1;
                const k = 1 - SLOTS[e.slot].dybde * 0.17;
                v.falling.push({ kind, x: p.x, y: p.y, vx: side * 520, vy: -260, rot: 0, vr: side * 14, k, floor: null, t: 0 });
                burst(v, p.x, p.y, 18, '#f3e6c4', 220, 2.5);
                sfx?.clang();
                v.shake = Math.max(v.shake, 0.35);
                break;
            }
            case 'kombo': {
                sfx?.kombo(e.n);
                if (e.n >= 3) v.hitstop = Math.max(v.hitstop, 0.05 + 0.02 * Math.min(4, e.n - 3));
                break;
            }
            case 'tittel': {
                // Et våpenskjold flyr fra tallerkenen opp til titlenes bok (poengkartusjen).
                const s = g.slots.find((x) => x.plate?.kind === 'vapen' && x.plate.spin >= TUNING.snurr.overspinn);
                const from = s ? platePos(s.id) : chestMouth();
                coin(v, 'skjold', from, { x: 880, y: 500 }, 120, 1.1);
                burst(v, from.x, from.y, 16, '#f0d58a', 160);
                sfx?.tittel();
                break;
            }
            case 'side': {
                const p = pagePos(e.slot);
                v.page = { slot: e.slot, kind: g.page?.kind ?? 'skip', u: 0, side: p.x < W / 2 ? -1 : 1, leaving: false };
                sfx?.side();
                break;
            }
            case 'ny': {
                v.rise[e.slot] = 0;
                if (v.page && v.page.slot === e.slot) v.page = null;
                const f = poleFoot(e.slot);
                burst(v, f.x, f.y, 10, '#8a6a40', 60, 2);
                sfx?.nyStang();
                break;
            }
            case 'tin-ned':
                sfx?.tinNed();
                break;
            case 'parlament': {
                for (const s of g.slots)
                    if (s.state === 'tatt' && v.hookOf[s.id] < 0) {
                        v.hookOf[s.id] = v.hoists.length;
                        v.hoists.push({ slot: s.id, hook: v.hoists.length, kind: g.taattKind[s.id], t: 0 });
                        smoke(v, lampX(s.id), STAGE.edge - 14);
                    }
                v.accSekk = 0;
                sfx?.parlament();
                v.shake = Math.max(v.shake, 0.3);
                break;
            }
            case 'protest': {
                v.protest[e.slot] = TUNING.protest.tid;
                const p = platePos(e.slot);
                burst(v, p.x, p.y, 14, '#c0303e', 140, 2.4);
                sfx?.protest();
                v.shake = Math.max(v.shake, 0.15);
                break;
            }
            case 'aar':
                sfx?.aar();
                break;
            case 'storm':
                sfx?.torden();
                v.lyn = 1;
                v.shake = Math.max(v.shake, 0.4);
                break;
            case 'seier':
                sfx?.seier();
                break;
            case 'slutt':
                v.teppeMal = 1;
                if (!g.won) sfx?.tap();
                break;
            default:
                break;
        }
    }
}

function lampX(slot: number) {
    return W / 2 + SLOTS[slot].x * 400;
}

/** Ett steg i visningen (dt i ekte sekunder, spillet kan stå stille). */
export function stepView(v: ViewState, g: Game, dt: number, gdt: number, sfx: Sfx | null) {
    v.tid += dt;
    v.shake = Math.max(0, v.shake - dt * 1.6);
    v.hitstop = Math.max(0, v.hitstop - dt);
    v.teppe += (v.teppeMal - v.teppe) * Math.min(1, dt * 1.4);
    if (v.demo > 0) v.demo += dt;

    const aar = aarNa(g);
    const playing = g.mode === 'play';
    for (const s of g.slots) {
        const i = s.id;
        if (s.plate) {
            v.lastKind[i] = s.plate.kind;
            v.vinkel[i] += Math.max(0, s.plate.spin) * 13 * gdt;
            // Overspinn: gnister fra den hvitglødende kanten.
            if (s.plate.spin >= TUNING.snurr.overspinn && Math.random() < dt * (v.lav ? 6 : 14)) {
                const p = platePos(i);
                const a = Math.random() * Math.PI * 2;
                const rx = 50 * (1 - SLOTS[i].dybde * 0.17);
                burst(v, p.x + Math.cos(a) * rx, p.y + Math.sin(a) * rx * 0.4, 2, '#fff6dc', 90, 1.6);
            }
        }
        v.rise[i] = Math.min(1, v.rise[i] + dt * 1.8);
        v.protest[i] = Math.max(0, v.protest[i] - dt);
        v.reddet[i] = Math.max(0, v.reddet[i] - dt);
        const tent = s.state === 'aktiv' || s.state === 'tom' ? 1 : 0;
        v.lamp[i] += (tent - v.lamp[i]) * Math.min(1, dt * (tent ? 3 : 1.2));
        // Mynter drypper fra snurrende tallerkener ned i kista.
        if (playing && s.plate) {
            v.acc[i] += inntekt(s) * gdt;
            if (v.acc[i] >= 1.4) {
                v.acc[i] -= 1.4;
                const p = platePos(i);
                const m = chestMouth();
                coin(v, 'gull', { x: p.x + (Math.random() - 0.5) * 20, y: p.y + 4 }, { x: m.x + (Math.random() - 0.5) * 70, y: m.y }, 40 + Math.random() * 40, 0.7 + Math.random() * 0.2);
            }
        }
    }
    v.spor = v.spor.filter((p) => v.tid - p.t < 0.45);

    // Hoffet tar alt over streken: mynter flyter ut til høyre (hoffet og flåten).
    if (playing) {
        v.accHoff += g.flyt.hoff * gdt;
        if (v.accHoff >= 1.2) {
            v.accHoff -= 1.2;
            const m = chestMouth();
            coin(v, 'hoff', { x: m.x + 30, y: m.y }, { x: W + 20, y: 470 + Math.random() * 40 }, 60, 1.1);
        }
        // Skottene drar mynter ut av kista med hånda.
        v.accSkott += g.flyt.skott * gdt;
        if (v.accSkott >= 3 && v.arm > 0.85) {
            v.accSkott -= 3;
            const m = chestMouth();
            coin(v, 'skott', { x: m.x - 30, y: m.y }, { x: -30, y: 500 + Math.random() * 30 }, 30, 0.9);
        }
        // Parlamentets gullsekker faller ned i kista mens tinntallerkenen øser.
        if (g.tin.state === 'oser') {
            v.accSekk += gdt;
            if (v.accSekk >= 0.32) {
                v.accSekk -= 0.32;
                const m = chestMouth();
                coin(v, 'sekk', { x: v.tin.x - 10, y: v.tin.y + 10 }, { x: m.x + 20 + Math.random() * 30, y: m.y }, 50, 0.75);
            }
        }
    }

    // Myntene flyr i en bue og lander.
    for (const c of v.coins) {
        c.t += dt / c.dur;
        c.rot += dt * 10;
        if (c.t >= 1) {
            if (c.kind === 'gull') {
                sfx?.coin();
                v.kisteSprett = Math.min(1, v.kisteSprett + 0.15);
            } else if (c.kind === 'sekk') {
                sfx?.sekk();
                v.kisteSprett = 1;
                burst(v, c.x1, c.y1, 8, '#d4a640', 90, 2);
            }
        }
    }
    v.coins = v.coins.filter((c) => c.t < 1);
    v.kisteSprett = Math.max(0, v.kisteSprett - dt * 3);

    for (const p of v.sparks) {
        p.life += dt;
        if (p.life < 0) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.smoke) {
            p.vx *= 0.98;
            p.size += dt * 5;
        } else {
            p.vy += 260 * dt;
            p.vx *= 0.99;
        }
    }
    v.sparks = v.sparks.filter((p) => p.life < p.max);

    // Tallerkener som faller: knuses mot gulvet i skår; de som flyr, forsvinner i kulissen.
    for (const f of v.falling) {
        f.t += dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 900 * dt;
        f.rot += f.vr * dt;
        if (f.floor !== null && f.y >= f.floor) {
            for (let i = 0; i < (v.lav ? 6 : 12); i++)
                v.sparks.push({ x: f.x, y: f.floor, vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 160, life: 0, max: 0.7 + Math.random() * 0.4, color: i % 3 ? '#d4a640' : '#8a6420', size: 3 + Math.random() * 2 });
            f.t = 99;
        }
    }
    v.falling = v.falling.filter((f) => f.t < 2 && f.x > -80 && f.x < W + 80);

    for (const h of v.hoists) h.t = Math.min(1, h.t + dt / 1.8);

    // Siden går inn fra kulissen, venter, og går ut igjen hvis du ikke tar tallerkenen.
    if (v.page) {
        const pg = v.page;
        const still = g.page && g.page.slot === pg.slot;
        if (!still) pg.leaving = true;
        pg.u = pg.leaving ? pg.u - dt * 1.2 : Math.min(1, pg.u + dt * 1.1);
        if (pg.leaving && pg.u <= 0) v.page = null;
    }

    // Tinntallerkenen glir mellom taket, rekkevidden og plassen foran rampen.
    const mal = g.tin.state === 'nede' ? TIN.nede : g.tin.state === 'oser' ? TIN.oser : TIN.oppe;
    const k = Math.min(1, dt * (g.tin.state === 'oser' ? 4 : 2.2));
    v.tin.x += (mal.x - v.tin.x) * k;
    v.tin.y += (mal.y - v.tin.y) * k;

    // Stormen: venstre kulisse fra 1637, begge fra 1639, lyn og trommer i krigen.
    const krig = aar >= TUNING.tid.skottene && g.mode !== 'over';
    v.stormL += ((aar >= TUNING.tid.varsel ? 1 : 0) - v.stormL) * Math.min(1, dt * 0.8);
    v.stormR += ((krig ? 1 : 0) - v.stormR) * Math.min(1, dt * 0.8);
    v.arm += ((krig ? 1 : 0) - v.arm) * Math.min(1, dt * 1.5);
    v.lyn = Math.max(0, v.lyn - dt * 3.5);
    if (krig && playing) {
        v.lynNeste -= gdt;
        if (v.lynNeste <= 0) {
            v.lynNeste = 2.5 + Math.random() * 3.5;
            v.lyn = 1;
            sfx?.torden();
            v.shake = Math.max(v.shake, 0.15);
        }
        v.tromme -= gdt;
        if (v.tromme <= 0) {
            v.tromme = 0.9;
            sfx?.tromme();
        }
    }

    // Kista nesten tom: rist og rødt blink.
    const sek = g.gull / Math.max(0.1, g.flyt.forbruk + g.flyt.skott);
    v.kisteVarsel += ((playing && sek < 4 ? 1 : 0) - v.kisteVarsel) * Math.min(1, dt * 4);
    // Tap på tom kiste: rampelysene slukner fra kantene.
    const morkMal = g.mode === 'over' && g.cause !== 'parlament' && !g.won ? 1 : 0;
    v.morke += (morkMal - v.morke) * Math.min(1, dt * 0.9);
}

/** Hvor mynten er nå (kvadratisk bue). */
export function coinPos(c: Coin): Pt {
    const t = Math.min(1, c.t);
    const u = 1 - t;
    return {
        x: u * u * c.x0 + 2 * u * t * c.cx + t * t * c.x1,
        y: u * u * c.y0 + 2 * u * t * c.cy + t * t * c.y1,
    };
}

/** Hvor siden står nå. */
export function pageAt(pg: PageAnim): Pt {
    const p = pagePos(pg.slot);
    const fra = pg.side < 0 ? STAGE.x0 - 20 : STAGE.x1 + 20;
    const e = pg.u * pg.u * (3 - 2 * pg.u);
    return { x: fra + (p.x - fra) * e, y: p.y };
}

/** Kroken en heist stang henger på, og hvor langt den har kommet (glatt). */
export function hoistPoint(h: Hoist): { base: Pt; e: number; dip: number } {
    const f = poleFoot(h.slot);
    const hook = hookPos(h.hook);
    // Først napper hånda stanga litt ned, så heises den opp i loftet.
    const dip = h.t < 0.25 ? Math.sin((h.t / 0.25) * Math.PI) * 10 : 0;
    const u = Math.max(0, (h.t - 0.25) / 0.75);
    const e = u * u * (3 - 2 * u);
    return { base: { x: f.x + (hook.x - f.x) * e, y: f.y + dip + (hook.y + 64 - f.y) * e }, e, dip };
}

/** Hvor tallerkenen siden bærer, er nå (over hodet hans). */
export function pagePlate(pg: PageAnim): Pt {
    const at = pageAt(pg);
    const k = 1 - SLOTS[pg.slot].dybde * 0.17;
    return { x: at.x, y: poleFoot(pg.slot).y - 92 * 1.15 * k };
}
