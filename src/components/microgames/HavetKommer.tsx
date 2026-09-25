import { useEffect, useRef, useState } from 'react';
import type { MicroGameProps } from './types';
import { MicroGameFrame } from './MicroGameFrame';
import {
    ArcadeStage,
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from './arcade/ArcadeShell';
import { useArcadeLoop, useArcadeAnnouncer, type ArcadeView } from './arcade/useArcade';
import type { ArcadeTheme } from './arcade/tokens';

// Spillets eget uttrykk: tykk blekkstrek på papir, som en tegneserie i et
// skolehefte. Havblå hovedknapp, oker som aksent. Canvas-tegningen bruker de
// samme to grunnfargene, så HUD og verden henger sammen.
const INK = '#22201c';
const PAPER = '#f3ead6';
const THEME: Partial<ArcadeTheme> = {
    ink: INK,
    paper: PAPER,
    accent: '#e8a93a',
    cta: '#1f5f78',
    chip: '#fffaf0',
    tilt: -2,
    radius: 14,
    line: 3,
    drop: 6,
};
import { createArcadeSynth, buzz, type ArcadeSynth } from './arcade/synth';
import { useArcadeSave, rankFor, nextRank } from './arcade/save';
import { usePlaytest } from './playtest';

// HAVET KOMMER - Doggerland, 11 000 til 7 800 år før nåtid.
//
// Referansespillet for arkadeformen (se build_microgame.md). Tone: lett.
//
// Kjerneløkka: maten er rikest i fjæra, og fjæra kryper østover. Går du inn i
// skogen, er du trygg men sulten. Står du i fjæra, spiser du godt, men tidevann,
// villsvin og Storegga-bølgen straffer den som står feil. Blir du igjen på en
// holme, blir holmen mindre.
//
// Lyspæra ligger i selve landskapet: havet stiger bare noen millimeter i året,
// men fordi Doggerland var et lavland, flytter kysten seg langt for hver meter.
// Ingen generasjon merker det - men leirene dere forlater, ender på havbunnen.
// Storegga-bølgen er dramatisk, men landet kommer seg etter den. Det er den
// langsomme stigningen som tar Doggerland.

// ---------------------------------------------------------------------------
// Innhold
// ---------------------------------------------------------------------------

const GAME_ID = 'havet-kommer';
const Y0 = 11000; // år før nåtid ved start
const Y1 = 7800; // Doggerbanken går under
const RUN_SECONDS = 180;
const YEARS_PER_SEC = (Y0 - Y1) / RUN_SECONDS;
const WORLD = 1000; // verdens lengde i enheter, vest -> øst
const L_END = 14; // havstigning i meter over hele runden (virkelig: ca. 16 m)
const BANK_X = 480; // Doggerbanken
const MAINLAND_X = 850; // her begynner høylandet i øst
const VS = 1.7; // vertikal overdrivelse: skjermenheter per meter
const WALK = 11;
const LIFETIME_YEARS = 70;

type EventId =
    | 'puls1'
    | 'puls2'
    | 'storegga'
    | 'banken'
    | 'notter'
    | 'hjort'
    | 'sel'
    | 'storm'
    | 'stille'
    | 'villsvin'
    | 'fisk';

interface GameEvent {
    id: EventId;
    t: string;
    s: string;
    d: number;
    color?: string;
}

const RANDOM_EVENTS: GameEvent[] = [
    { id: 'notter', t: 'HASSELNØTT-HØST', s: 'Buskene er fulle. Spis mens du kan.', d: 11, color: '#8a5a2b' },
    { id: 'hjort', t: 'HJORTEFLOKK', s: 'Hjorten er raskere enn deg. Spydet er raskere enn hjorten.', d: 12, color: '#7a4a1c' },
    { id: 'sel', t: 'SEL PÅ STRANDA', s: 'Tungt, fett og lett å ta. Hele følget blir mett.', d: 10, color: '#1f4f5f' },
    { id: 'storm', t: 'STORM', s: 'Bølgene slår langt inn. Hold deg unna fjæra.', d: 10, color: '#3d4a5c' },
    { id: 'stille', t: 'STILLE ÅR', s: '', d: 7, color: '#6b7b6b' },
    { id: 'villsvin', t: 'VILLSVIN I SKOGEN', s: 'De er ikke enige i at dette er jaktmarka di.', d: 12, color: '#6b3a1f' },
    { id: 'fisk', t: 'FISKESTIM I VIKA', s: 'Fisken hopper nesten i hendene dine.', d: 10, color: '#1f6f8b' },
];

const STILLE = [
    'Ingen merket noe. Havet steg 4 millimeter.',
    'Bestefar forteller om fiskeplassen sin. Den ligger ute i sjøen nå.',
    'Barna leker i fjæra. Det er et fint år.',
    'Det skjer ingenting. Det er også historie.',
];

interface Find {
    id: string;
    icon: string;
    name: string;
    fact: string;
    afterStoregga?: boolean;
}

// Havbunnsarkivet - samlingen går igjen mellom runder. Hvert funn er et faktum
// fra artikkelen. Dette er MÅKA-trofeene, bare at de lærer bort noe.
const FINDS: Find[] = [
    { id: 'oks', icon: '🪓', name: 'Pyntet øks av hvalbein', fact: 'Trålet opp fra Nordsjøen. Datert til 9 500 år før nåtid.' },
    { id: 'krok', icon: '🪝', name: 'Krok av bein, 293 mm', fact: 'Funnet utenfor Vest-Agder. Laget mellom 7725 og 7535 fvt.' },
    { id: 'tann', icon: '🦷', name: 'Mammuttann', fact: 'Fiskere har dratt opp mammutknokler i over hundre år.' },
    { id: 'knokkel', icon: '🦴', name: 'Knokkel med innrisset mønster', fact: 'Kunst fra havbunnen. Noen satt og risset mønster i et storfebein.' },
    { id: 'flint', icon: '🔪', name: 'Flintkniv', fact: 'Flint og bein er det som oftest kommer opp i garna.' },
    { id: 'harpun', icon: '🔱', name: 'Harpun av bein', fact: 'Sel, fisk og skjell var trolig den viktigste maten.' },
    { id: 'torv', icon: '🟤', name: 'Torvklump', fact: 'Torv dannes bare på land. Torv på havbunnen viser at det var tørt der.' },
    { id: 'mose', icon: '🌿', name: 'Mosestengel fra Storegga-laget', fact: 'Bølgen begravde den. Datert til 8 140 år før nåtid, pluss minus 30 år.', afterStoregga: true },
];

const RANKS: [number, string][] = [
    [0, 'Skjellplukker'],
    [2000, 'Strandfinner'],
    [5000, 'Hjortejeger'],
    [9000, 'Leirsjef'],
    [13000, 'Doggerlands vokter'],
    [17000, 'Stammor til halve Nord-Europa'],
];

type Cause = 'hunger' | 'inland' | 'swim' | 'storegga' | 'boar' | 'bank';

const DEATH: Record<Cause, string[]> = {
    hunger: [
        'Maten tok slutt før havet gjorde det.',
        'Følget ble for sultent til å gå videre.',
    ],
    inland: [
        'Innlandsskogen var trygg. Men det fantes nesten ikke mat der.',
        'Skjellene lå i fjæra hele tiden. Dere var for langt inne i skogen.',
    ],
    swim: [
        'Kaldt vann tar kreftene fort. Følget kom seg ikke i land.',
        'Du ble for lenge på en holme som ble mindre og mindre.',
    ],
    storegga: [
        'Bølgen fra Storegga traff deg nede i fjæra. Høyt terreng hadde reddet deg.',
        'Da havet trakk seg tilbake, var det et varsel. Ikke en gave.',
    ],
    boar: ['Villsvinet vant. Det har forsvart denne skogen lenge før deg.'],
    bank: [
        'Doggerbanken var det siste som gikk under. Dere var der da det skjedde.',
        'Dere ble igjen ute i havet da landet forsvant. Kysten i øst var for langt unna.',
    ],
};

// Ett konkret råd per dødsårsak, så neste runde blir bedre - ikke bare et nytt forsøk.
const TIPS: Record<Cause, string> = {
    hunger: 'Tips: plukk skjell i fjæra i stedet for å vente. Flere på rad gir mer mat.',
    inland: 'Tips: målet er ikke å komme lengst øst, men å overleve tida ut. Følg fjæra.',
    swim: 'Tips: når du ser vann øst for deg, står du på en holme. Gå østover med en gang.',
    storegga: 'Tips: når havet plutselig trekker seg tilbake, løp opp på høyere land.',
    boar: 'Tips: villsvinet stanger når du kommer nær. Kast spydet før det når deg.',
    bank: 'Tips: gå av Doggerbanken når du får varselet. Landet i øst er trygt.',
};

const PAUSE_MSG = [
    'Havet venter ikke. Men akkurat nå gjør det det.',
    'Følget tar en pust i bakken.',
    'Skjellene blir liggende. Foreløpig.',
];

// ---------------------------------------------------------------------------
// Verden
// ---------------------------------------------------------------------------

function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const gauss = (x: number, mu: number, w: number) => Math.exp(-(((x - mu) / w) ** 2));
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Landskapet stiger jevnt østover, med noen få bevisste rygger. Det er viktig
// for lesbarheten: vann ØST for deg betyr da alltid at du står på en holme som
// blir en øy - aldri at en tilfeldig dump lenger inne fyller seg. Doggerbanken
// er den største ryggen.
function makeTerrain(seed: number): Float32Array {
    const r = mulberry(seed);
    const p1 = r() * 6.28;
    const p2 = r() * 6.28;
    const ridges: [number, number, number][] = [];
    for (let x = 140 + r() * 40; x < MAINLAND_X - 60; x += 95 + r() * 60) {
        if (Math.abs(x - BANK_X) < 90) continue;
        ridges.push([x, 1.1 + r() * 0.9, 9 + r() * 7]);
    }
    const h = new Float32Array(WORLD + 1);
    for (let x = 0; x <= WORLD; x++) {
        const base = -0.4 + 0.0172 * x;
        const n = 0.22 * Math.sin(x * 0.07 + p1) + 0.1 * Math.sin(x * 0.19 + p2) + 0.06 * Math.sin(x * 0.61);
        let bumps = 0;
        for (const [rx, rh, rw] of ridges) bumps += rh * gauss(x, rx, rw);
        const mainland = x > MAINLAND_X ? (x - MAINLAND_X) * 0.12 : 0;
        h[x] = base + n + bumps + mainland;
    }
    // Doggerbanken: en bred rygg som skal gå under akkurat mot slutten.
    for (let x = 0; x <= WORLD; x++) h[x] += 1 * gauss(x, BANK_X, 34);
    let top = -99;
    for (let x = BANK_X - 40; x <= BANK_X + 40; x++) top = Math.max(top, h[x]);
    const lift = L_END - 0.2 - top;
    for (let x = 0; x <= WORLD; x++) h[x] += lift * gauss(x, BANK_X, 34);
    // Startstedet skal være tørt og litt høyt.
    for (let x = 30; x <= 90; x++) h[x] = Math.max(h[x], 1.2 * gauss(x, 58, 20) + 0.2);
    return h;
}

// Stigningstakt (relativ). Toppene er de to raske periodene fra Hijma mfl. (2025).
const relRate = (y: number) => 1 + 0.8 * gauss(y, 10300, 120) + 0.7 * gauss(y, 8300, 120);
// Virkelig takt i mm/år, til «i bestefars levetid»-regnestykket.
const realRate = (y: number) => 4.3 + 4.6 * gauss(y, 10300, 120) + 3.8 * gauss(y, 8300, 120);

const SEA_TABLE: Float32Array = (() => {
    const n = Y0 - Y1;
    const t = new Float32Array(n + 1);
    let acc = 0;
    for (let i = 0; i <= n; i++) {
        t[i] = acc;
        acc += relRate(Y0 - i);
    }
    for (let i = 0; i <= n; i++) t[i] = (t[i] / acc) * L_END;
    return t;
})();

function seaAtYear(y: number) {
    const i = clamp(Y0 - y, 0, Y0 - Y1);
    const a = Math.floor(i);
    const b = Math.min(a + 1, Y0 - Y1);
    return lerp(SEA_TABLE[a], SEA_TABLE[b], i - a);
}

// ---------------------------------------------------------------------------
// Spilltilstand
// ---------------------------------------------------------------------------

type ItemKind = 'skjell' | 'fisk' | 'sel' | 'funn';
interface Item {
    kind: ItemKind;
    x: number;
    m: number;
    vx: number;
    vm: number;
    g: number;
    rot: number;
    life: number;
    find?: Find;
    dead?: boolean;
}
interface Bush {
    x: number;
    nuts: number;
    t: number;
}
interface Animal {
    kind: 'hjort' | 'villsvin';
    x: number;
    vx: number;
    face: number;
    state: 'graze' | 'flee' | 'charge' | 'recover' | 'dead';
    t: number;
    m: number;
    vm: number;
}
interface Spear {
    x: number;
    m: number;
    vx: number;
    vm: number;
    stuck: number;
    rot: number;
}
interface Camp {
    x: number;
    m: number;
    gen: number;
}
interface Part {
    type: 'crumb' | 'drop' | 'spark' | 'rain' | 'bubble' | 'dust';
    x: number;
    m: number;
    vx: number;
    vm: number;
    g: number;
    life: number;
    max: number;
    size: number;
    color: string;
}
interface FloatText {
    x: number;
    m: number;
    t: string;
    color: string;
    size: number;
    life: number;
    max: number;
    rot: number;
}

interface Game {
    t: number;
    year: number;
    sea: number;
    seed: number;
    terrain: Float32Array;
    bushes: Bush[];
    trees: { x: number; kind: 0 | 1 | 2; s: number }[];
    p: {
        x: number;
        m: number;
        face: number;
        walk: number;
        vx: number;
        kx: number;
        inv: number;
        spearCd: number;
        depth: number;
        squash: number;
    };
    followers: { x: number; m: number; face: number; walk: number; col: string; scale: number }[];
    hunger: number;
    score: number;
    combo: number;
    comboT: number;
    maxCombo: number;
    items: Item[];
    animals: Animal[];
    spears: Spear[];
    camps: Camp[];
    parts: Part[];
    texts: FloatText[];
    event: GameEvent | null;
    eventLeft: number;
    eventT: number;
    lastEv: EventId | null;
    done: Set<EventId>;
    storegga: { phase: 'none' | 'drawdown' | 'wave' | 'after'; t: number; front: number; hit: boolean };
    shellT: number;
    fishT: number;
    animalT: number;
    genT: number;
    gen: number;
    findsPlanned: { at: number; find: Find }[];
    stats: { food: number; kills: number; finds: string[]; shells: number };
    shake: number;
    flash: number;
    cause: Cause;
    dying: number;
    outro: number;
    camX: number;
    camM: number;
    tide: number;
    tideAmp: number;
    lastMult: number;
    islandWarned: boolean;
    saddle: { x: number; m: number };
    holmeT: number;
    inlandT: number;
    input: { ptrSX: number | null; key: number };
}

const TUNICS = ['#9b6b3d', '#7a5230', '#b07a45', '#8c5e3c', '#a8683a', '#6e4a2c'];

function newGame(seed: number, found: string[]): Game {
    const terrain = makeTerrain(seed);
    const r = mulberry(seed + 7);
    const bushes: Bush[] = [];
    const trees: Game['trees'] = [];
    for (let x = 20; x < WORLD; x += 4 + r() * 6) {
        const k = r();
        if (k < 0.12) bushes.push({ x, nuts: 3, t: 0 });
        else trees.push({ x, kind: k < 0.6 ? 0 : k < 0.85 ? 1 : 2, s: 0.8 + r() * 0.5 });
    }
    // Tre funn per runde. Nye funn foretrekkes, så samlingen vokser.
    const pool = FINDS.filter((f) => !f.afterStoregga);
    const fresh = pool.filter((f) => !found.includes(f.id));
    const chosen: Find[] = [];
    while (chosen.length < 3) {
        const src = fresh.length && Math.random() < 0.75 ? fresh : pool;
        const f = pick(src);
        if (!chosen.includes(f)) chosen.push(f);
        const i = fresh.indexOf(f);
        if (i >= 0) fresh.splice(i, 1);
    }
    const g: Game = {
        t: 0,
        year: Y0,
        sea: 0,
        seed,
        terrain,
        bushes,
        trees,
        p: { x: 58, m: 0, face: 1, walk: 0, vx: 0, kx: 0, inv: 0, spearCd: 0, depth: 0, squash: 0 },
        followers: [0, 1].map((i) => ({
            x: 58 - 2 - i * 2,
            m: 0,
            face: 1,
            walk: i,
            col: TUNICS[(i + 1) % TUNICS.length],
            scale: i === 1 ? 0.7 : 0.9,
        })),
        hunger: 100,
        score: 0,
        combo: 0,
        comboT: 0,
        maxCombo: 0,
        items: [],
        animals: [],
        spears: [],
        camps: [],
        parts: [],
        texts: [],
        event: null,
        eventLeft: 0,
        eventT: 13,
        lastEv: null,
        done: new Set(),
        storegga: { phase: 'none', t: 0, front: 0, hit: false },
        shellT: 0,
        fishT: 4,
        animalT: 9,
        genT: 11,
        gen: 1,
        findsPlanned: [
            { at: 24, find: chosen[0] },
            { at: 62, find: chosen[1] },
            { at: 104, find: chosen[2] },
        ],
        stats: { food: 0, kills: 0, finds: [], shells: 0 },
        shake: 0,
        flash: 0,
        cause: 'hunger',
        dying: 0,
        outro: 0,
        camX: 58,
        camM: 1,
        tide: 0,
        tideAmp: 0.16,
        lastMult: 1,
        islandWarned: false,
        saddle: { x: BANK_X + 60, m: 99 },
        holmeT: 6,
        inlandT: 0,
        input: { ptrSX: null, key: 0 },
    };
    // Sadelen: laveste punkt mellom banken og landet i øst.
    // (terrenget stiger jevnt, så sadelen er foten av banken på østsiden)
    for (let x = BANK_X + 20; x < BANK_X + 140; x++)
        if (terrain[x] < g.saddle.m) g.saddle = { x, m: terrain[x] };
    g.p.m = ground(g, g.p.x);
    for (const f of g.followers) f.m = ground(g, f.x);
    g.camM = g.p.m + 2;
    return g;
}

function ground(g: Game, x: number) {
    const xc = clamp(x, 0, WORLD);
    const a = Math.floor(xc);
    const b = Math.min(a + 1, WORLD);
    return lerp(g.terrain[a], g.terrain[b], xc - a);
}

function tideAmp(g: Game) {
    const e = g.event?.id;
    if (e === 'storm') return 0.42;
    if (e === 'stille') return 0.05;
    return 0.16;
}

/** Vannstand ved x: havnivå + tidevann + Storegga-bølgen. */
function water(g: Game, x: number) {
    let w = g.sea + g.tide;
    const s = g.storegga;
    if (s.phase === 'drawdown') w -= 1.7 * Math.min(1, s.t / 1.2);
    if (s.phase === 'wave') {
        const d = s.front - x; // >0: bølgen har passert x
        if (d > -6) {
            const crest = d < 0 ? (d + 6) / 6 : Math.max(0, 1 - d / 90);
            w += 3.9 * crest - 1.7 * Math.max(0, 1 - s.t / 0.6);
        } else w -= 1.7 * Math.max(0, 1 - s.t / 0.6);
    }
    if (s.phase === 'after') w += 1.4 * Math.max(0, 1 - s.t / 4);
    if (g.event?.id === 'storm') w += 0.25 * Math.sin(x * 0.35 + g.t * 3.1);
    return w;
}

// ---------------------------------------------------------------------------
// Oppdatering
// ---------------------------------------------------------------------------

type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'outro' | 'over';

interface IO {
    mode: Mode;
    sfx: ReturnType<typeof makeSfx>;
    banner: (t: string, s?: string, color?: string) => void;
    toast: (t: string) => void;
    die: () => void;
    win: () => void;
}

function makeSfx(a: ArcadeSynth) {
    return {
        shell: (c: number) => {
            const f = 520 + Math.min(c, 12) * 50;
            a.tone(f, f * 1.8, 0.07, 'square', 0.06);
            a.tone(f * 1.5, f * 2.6, 0.07, 'triangle', 0.06, 0.05);
        },
        eat: () => {
            a.tone(300, 480, 0.06, 'square', 0.05);
            a.tone(340, 560, 0.06, 'square', 0.05, 0.07);
        },
        throw: () => a.noise(0.14, 0.18, 1800),
        thud: () => {
            a.noise(0.18, 0.3, 300);
            a.tone(180, 60, 0.18, 'sine', 0.2);
        },
        kill: () => a.arp(392, [0, 4, 7, 12], 0.07, 0.08),
        hurt: () => {
            a.noise(0.25, 0.35, 240);
            a.tone(260, 80, 0.3, 'sawtooth', 0.1);
        },
        splash: () => a.noise(0.5, 0.3, 700),
        event: () => {
            a.tone(330, 660, 0.14, 'triangle', 0.13);
            a.tone(495, 990, 0.2, 'triangle', 0.1, 0.13);
            a.tone(660, 1320, 0.25, 'triangle', 0.08, 0.26);
        },
        rumble: () => {
            a.noise(2.2, 0.45, 90);
            a.tone(70, 35, 2.2, 'sawtooth', 0.12);
        },
        wave: () => a.noise(2.6, 0.5, 500),
        find: () => a.arp(523, [0, 4, 7, 12, 16, 19], 0.07, 0.07),
        birth: () => a.arp(660, [0, 7, 12], 0.09, 0.05),
        die: () => {
            a.tone(600, 60, 1.2, 'sawtooth', 0.1);
            a.tone(620, 70, 1.2, 'square', 0.03);
        },
        win: () => a.arp(392, [0, 4, 7, 12, 16, 19, 24], 0.1, 0.08),
        warn: () => a.tone(520, 500, 0.08, 'square', 0.05),
        step: () => a.noise(0.03, 0.05, 2400),
    };
}

function text(g: Game, x: number, m: number, t: string, color = '#fff', size = 1.9) {
    g.texts.push({ x, m, t, color, size, life: 1.1, max: 1.1, rot: rand(-0.12, 0.12) });
}
function crumbs(g: Game, x: number, m: number, n: number, color: string) {
    for (let i = 0; i < n; i++)
        g.parts.push({
            type: 'crumb',
            x,
            m,
            vx: rand(-9, 9),
            vm: rand(3, 9),
            g: 22,
            life: rand(0.4, 0.8),
            max: 0.8,
            size: rand(0.25, 0.5),
            color,
        });
}
function drops(g: Game, x: number, m: number, n: number) {
    for (let i = 0; i < n; i++)
        g.parts.push({
            type: 'drop',
            x: x + rand(-1, 1),
            m,
            vx: rand(-7, 7),
            vm: rand(4, 11),
            g: 26,
            life: rand(0.5, 0.9),
            max: 0.9,
            size: rand(0.2, 0.4),
            color: '#cfeaf5',
        });
}

const mult = (g: Game) => clamp(1 + Math.floor(g.combo / 4), 1, 4);

function addCombo(g: Game) {
    g.combo++;
    g.comboT = 2.4;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
}

function feed(g: Game, io: IO, food: number, points: number, x: number, m: number, label: string, color: string) {
    addCombo(g);
    const before = g.stats.food;
    g.stats.food += 1;
    g.hunger = Math.min(100, g.hunger + food);
    const p = points * mult(g);
    g.score += p;
    text(g, x, m + 2.2, `${label}+${p}`, color, label ? 1.8 : 1.3);
    const mu = mult(g);
    if (mu > g.lastMult) text(g, g.p.x, g.p.m + 4.6, `×${mu}!`, '#ffd43b', 1.7 + mu * 0.25);
    g.lastMult = mu;
    // Følget vokser med maten.
    const size = (n: number) => Math.min(9, 2 + Math.floor(n / 14));
    if (size(g.stats.food) > size(before)) {
        const i = g.followers.length;
        g.followers.push({
            x: g.p.x - 2 * (i + 1) * g.p.face,
            m: g.p.m,
            face: g.p.face,
            walk: i,
            col: TUNICS[i % TUNICS.length],
            scale: 0.55,
        });
        io.toast(`Et barn er født! Følget er nå ${g.followers.length + 1}.`);
        io.sfx.birth();
    }
}

function hurt(g: Game, io: IO, n: number, cause: Cause) {
    if (g.p.inv > 0 || io.mode !== 'play') return false;
    g.hunger -= n;
    g.p.inv = 1.2;
    g.shake = 0.45;
    g.flash = 0.25;
    g.combo = 0;
    g.cause = cause;
    io.sfx.hurt();
    buzz([35, 40, 35]);
    text(g, g.p.x, g.p.m + 3, `-${n}`, '#ff5a4a', 2);
    if (g.hunger <= 0) io.die();
    return true;
}

function startEvent(g: Game, io: IO, e: GameEvent) {
    g.event = e;
    g.eventLeft = e.d;
    g.lastEv = e.id;
    io.banner(e.t, e.id === 'stille' ? pick(STILLE) : e.s, e.color);
    io.sfx.event();
    buzz(20);
    if (e.id === 'notter') for (const b of g.bushes) b.nuts = 3;
    if (e.id === 'hjort') for (let i = 0; i < 4; i++) spawnAnimal(g, 'hjort', rand(18, 44));
    if (e.id === 'villsvin') {
        spawnAnimal(g, 'villsvin', rand(22, 30));
        spawnAnimal(g, 'villsvin', rand(36, 48));
    }
    if (e.id === 'sel') {
        const lines = waterlines(g, g.p.x - 10, g.p.x + 40);
        for (let i = 0; i < 3 && lines.length; i++) {
            const l = pick(lines);
            const x = l.x + l.land * rand(0.5, 2.5);
            g.items.push({ kind: 'sel', x, m: ground(g, x), vx: 0, vm: 0, g: 0, rot: 0, life: 14 });
        }
    }
}

function spawnAnimal(g: Game, kind: Animal['kind'], ahead: number) {
    const x = g.p.x + ahead;
    if (water(g, x) > ground(g, x) - 0.2) return;
    g.animals.push({ kind, x, vx: 0, face: -1, state: 'graze', t: rand(0, 3), m: ground(g, x), vm: 0 });
}

/** Punkter der vann møter land innenfor [a, b]. `land` = retningen til land (+1 øst, -1 vest). */
function waterlines(g: Game, a: number, b: number) {
    const out: { x: number; land: number }[] = [];
    let prev = water(g, a) > ground(g, a);
    for (let x = a + 0.5; x <= b; x += 0.5) {
        const wet = water(g, x) > ground(g, x);
        if (wet !== prev) out.push({ x, land: wet ? -1 : 1 });
        prev = wet;
    }
    return out;
}

function update(g: Game, dt: number, io: IO) {
    const live = io.mode === 'play';
    const menu = io.mode === 'menu';
    const p = g.p;
    g.t += dt;
    g.tideAmp = lerp(g.tideAmp, tideAmp(g), dt * 0.5);
    g.tide = g.tideAmp * Math.sin(g.t * 0.55);

    if (live) {
        g.year = Math.max(Y1, g.year - YEARS_PER_SEC * dt);
        g.sea = seaAtYear(g.year);
    }

    // --- historiske hendelser på riktig år ---
    if (live) {
        const at = (id: EventId, y: number, fn: () => void) => {
            if (g.year <= y && !g.done.has(id)) {
                g.done.add(id);
                fn();
            }
        };
        at('puls1', 10380, () =>
            startEvent(g, io, {
                id: 'puls1',
                t: 'HAVET STIGER FORTERE',
                s: 'Nesten 9 millimeter i året. Omtrent like fort som en negl vokser.',
                d: 9,
                color: '#1f6f8b',
            })
        );
        at('puls2', 8460, () =>
            startEvent(g, io, {
                id: 'puls2',
                t: 'HAVET STIGER FORTERE IGJEN',
                s: '8 millimeter i året. I et lavland flytter kysten seg langt.',
                d: 9,
                color: '#1f6f8b',
            })
        );
        at('storegga', 8190, () => {
            g.event = null;
            g.storegga = { phase: 'drawdown', t: 0, front: g.p.x - 40, hit: false };
            io.banner('STOREGGA-RASET', 'Et enormt fjellskred har løsnet utenfor Sunnmøre.', '#b8322a');
            io.sfx.rumble();
            g.shake = 1.6;
            buzz([80, 60, 80, 60, 200]);
            // Havet trekker seg tilbake og blotter fjæra. Fristende. Farlig.
            const lines = waterlines(g, g.p.x - 25, g.p.x + 30);
            for (const l of lines)
                for (let i = 0; i < 5; i++) {
                    const x = l.x - l.land * rand(1, 9);
                    g.items.push({ kind: 'skjell', x, m: ground(g, x), vx: 0, vm: 0, g: 0, rot: rand(-0.4, 0.4), life: 9 });
                }
        });
        // Doggerbanken: varsle FØR sadelen mot land i øst går under, mens det
        // ennå er kort å gå. Etterpå: påminnelse så lenge du står på øya.
        const onBank = p.x < g.saddle.x && p.x > BANK_X - 120;
        if (!g.islandWarned && g.sea + tideAmp(g) > g.saddle.m - 0.6 && onBank) {
            g.islandWarned = true;
            io.banner('DOGGERBANKEN BLIR EN ØY', 'Blir du her, blir du fanget. Gå østover nå!', '#1f4f5f');
            io.sfx.event();
            g.holmeT = 8;
        }
        if (g.islandWarned && onBank && g.holmeT <= 0) {
            g.holmeT = 8;
            io.toast('Du er fortsatt på Doggerbanken. Landet ligger i øst.');
            io.sfx.warn();
        }
        // Holme-varsel: vann øst for deg betyr at du står på noe som blir en øy.
        // Innlandsvarsel: langt fra vann er det nesten ingen mat.
        if (g.t > 15 && nearestWaterDist(g) > 32) g.inlandT += dt;
        else g.inlandT = 0;
        if (g.inlandT > 3) {
            g.inlandT = -9;
            io.toast('Lite mat inne i skogen. Skjell og fisk finner du i fjæra, mot vest.');
            io.sfx.warn();
        }
        g.holmeT -= dt;
        const onBankNow = p.x < g.saddle.x && p.x > BANK_X - 120;
        if (g.holmeT <= 0 && p.depth === 0 && !onBankNow && onHolme(g)) {
            g.holmeT = 14;
            io.toast('Du står på en holme. Den blir mindre. Gå østover!');
            io.sfx.warn();
        }
        if (g.year <= Y1) {
            // Du vinner så lenge følget er øst for Doggerbanken - også om du
            // står og vasser i fjæra. Bare den som ble igjen på banken, taper.
            if (p.x < g.saddle.x) {
                g.cause = 'bank';
                io.die();
            } else io.win();
            return;
        }
    }

    // --- Storegga ---
    const s = g.storegga;
    if (s.phase !== 'none') {
        s.t += dt;
        if (s.phase === 'drawdown' && s.t > 3.4) {
            s.phase = 'wave';
            s.t = 0;
            s.front = g.p.x - 34;
            io.sfx.wave();
            io.toast('Bølgen kommer! Kom deg opp!');
        } else if (s.phase === 'wave') {
            s.front += 17 * dt;
            if (live && !s.hit && water(g, p.x) > ground(g, p.x) + 0.6 && s.front > p.x - 4) {
                s.hit = true;
                if (hurt(g, io, 34, 'storegga')) {
                    p.kx = 16;
                    drops(g, p.x, p.m + 1, 20);
                    io.sfx.splash();
                }
            }
            if (s.front > p.x + 70) {
                s.phase = 'after';
                s.t = 0;
            }
        } else if (s.phase === 'after' && s.t > 4) {
            s.phase = 'none';
            if (live) {
                io.banner('LANDET KOM SEG', 'Bølgen tok ikke Doggerland. Havet som fortsatte å stige, gjorde det.', '#3f7d3a');
                io.sfx.event();
                if (!s.hit) {
                    g.score += 300;
                    text(g, p.x, p.m + 4, 'I TIDE! +300', '#9fe3ff', 2.2);
                }
                // Mosestengelen fra Storegga-laget dukker opp i den nye sanden.
                const mose = FINDS.find((f) => f.id === 'mose');
                if (mose) g.findsPlanned.push({ at: g.t + 3, find: mose });
                g.eventT = 9;
            }
        }
    }

    // --- tilfeldige hendelser ---
    if (live && s.phase === 'none') {
        if (g.event) {
            g.eventLeft -= dt;
            if (g.eventLeft <= 0) {
                g.event = null;
                g.eventT = rand(9, 13);
            }
        } else {
            g.eventT -= dt;
            if (g.eventT <= 0) {
                let e: GameEvent;
                let tries = 0;
                do {
                    e = pick(RANDOM_EVENTS);
                    tries++;
                } while (tries < 20 && (e.id === g.lastEv || (e.id === 'stille' && g.t < 25)));
                startEvent(g, io, e);
            }
        }
    }

    // --- spiller ---
    const gp = ground(g, p.x);
    const w = water(g, p.x);
    p.depth = Math.max(0, w - gp);
    const swimming = p.depth > 0.75;
    const wading = p.depth > 0.12 && !swimming;
    if (live) {
        let dir = g.input.key;
        if (g.input.ptrSX !== null) {
            const U = viewU;
            const tx = g.camX + (g.input.ptrSX - viewW * 0.42) / U;
            const d = tx - p.x;
            dir = Math.abs(d) < 0.5 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) / 2.5);
        }
        const speed = WALK * (swimming ? 0.52 : wading ? 0.7 : 1);
        p.vx = lerp(p.vx, dir * speed, dt * 12);
        if (dir !== 0) p.face = Math.sign(dir);
        p.inv = Math.max(0, p.inv - dt);
        p.spearCd = Math.max(0, p.spearCd - dt);
        // sult
        const e = g.event?.id;
        if (e !== 'stille') {
            const drain = (3.0 + (g.t / RUN_SECONDS) * 1.4) * (swimming ? 1.55 : wading ? 1.1 : 1);
            g.hunger -= drain * dt;
        }
        if (g.hunger <= 0) {
            g.cause = swimming ? 'swim' : g.cause === 'storegga' || g.cause === 'boar' ? g.cause : nearestWaterDist(g) > 30 ? 'inland' : 'hunger';
            io.die();
        }
        if (g.combo > 0) {
            g.comboT -= dt;
            if (g.comboT <= 0) {
                g.combo = 0;
                g.lastMult = 1;
            }
        }
        g.score += YEARS_PER_SEC * dt * 0.25;
    } else if (menu) {
        p.vx = lerp(p.vx, 0, dt * 6);
    } else p.vx = lerp(p.vx, 0, dt * 3);

    p.kx = lerp(p.kx, 0, dt * 3);
    p.x = clamp(p.x + (p.vx + p.kx) * dt, 4, WORLD - 4);
    const target = swimming ? w - 0.55 : ground(g, p.x);
    p.m = io.mode === 'dying' ? p.m - dt * 1.2 : lerp(p.m, target, dt * 14);
    p.walk += Math.abs(p.vx) * dt * 0.9;
    p.squash = Math.max(0, p.squash - dt * 1.5);
    if (Math.abs(p.vx) > 3 && !swimming && Math.random() < dt * 6) {
        g.parts.push({ type: 'dust', x: p.x - p.face * 0.6, m: p.m + 0.1, vx: -p.face * 2, vm: 1, g: 0, life: 0.4, max: 0.4, size: rand(0.3, 0.6), color: wading ? '#dff3fb' : '#c9b48a' });
    }
    if (swimming && Math.random() < dt * 3) g.parts.push({ type: 'bubble', x: p.x + rand(-0.8, 0.8), m: w, vx: 0, vm: 0.6, g: 0, life: 0.6, max: 0.6, size: 0.3, color: '#fff' });

    // følget: hver følger går etter den foran seg
    let lead = { x: p.x, face: p.face };
    for (const f of g.followers) {
        const want = lead.x - lead.face * 1.9;
        const d = want - f.x;
        const v = clamp(d * 4, -WALK * 1.1, WALK * 1.1);
        f.x += v * dt;
        if (Math.abs(v) > 0.4) f.face = Math.sign(v);
        f.walk += Math.abs(v) * dt * 0.9;
        const fw = water(g, f.x);
        const fg = ground(g, f.x);
        f.m = lerp(f.m, fw - fg > 0.6 ? fw - 0.5 * f.scale : fg, dt * 12);
        lead = { x: f.x, face: f.face };
    }

    // kamera (i utspillet styrer utspillet kameraet selv)
    if (io.mode !== 'outro') {
        const lookAhead = p.face * 5;
        g.camX = lerp(g.camX, p.x + lookAhead, dt * 3);
        g.camM = lerp(g.camM, p.m + 2.4, dt * 2.5);
    }

    // --- generasjoner og leirer ---
    if (live) {
        g.genT -= dt;
        if (g.genT <= 0 && !swimming) {
            g.genT = 11;
            g.gen += 1;
            const prev = g.camps[g.camps.length - 1];
            if (!prev || Math.abs(prev.x - p.x) > 6) g.camps.push({ x: p.x - p.face * 3, m: ground(g, p.x - p.face * 3), gen: g.gen });
            const cm = Math.round((realRate(g.year) * LIFETIME_YEARS) / 10);
            io.toast(`Ny generasjon. I bestefars levetid steg havet ${cm} cm. Ingen merket det.`);
        }
    }

    // --- spawning ---
    if (live) {
        // skjell i fjæra, rikest i tidevannssonen
        g.shellT -= dt;
        const nearShells = g.items.filter((i) => i.kind === 'skjell' && Math.abs(i.x - p.x) < 45).length;
        if (g.shellT <= 0 && nearShells < 14) {
            g.shellT = g.event?.id === 'stille' ? 0.2 : 0.32;
            const lines = waterlines(g, g.camX - 30, g.camX + 36);
            if (lines.length) {
                const l = pick(lines);
                const x = l.x + l.land * rand(-2, 6);
                const gx = ground(g, x);
                if (gx > g.sea + g.tide - 0.9) g.items.push({ kind: 'skjell', x, m: gx, vx: 0, vm: 0, g: 0, rot: rand(-0.4, 0.4), life: rand(10, 16) });
            }
        }
        // fisk hopper ut av vannet nær land
        g.fishT -= dt;
        if (g.fishT <= 0) {
            g.fishT = g.event?.id === 'fisk' ? rand(0.4, 0.8) : rand(3.5, 6);
            const lines = waterlines(g, g.p.x - 20, g.p.x + 30);
            if (lines.length) {
                const l = pick(lines);
                const x = l.x - l.land * rand(2, 6);
                const wx = water(g, x);
                if (wx > ground(g, x) + 0.3)
                    g.items.push({ kind: 'fisk', x, m: wx, vx: l.land * rand(2.5, 4.5), vm: rand(8, 11), g: 16, rot: 0, life: 2.5 });
            }
        }
        // dyr i skogen
        g.animalT -= dt;
        if (g.animalT <= 0) {
            g.animalT = rand(10, 16);
            spawnAnimal(g, g.t < 40 || Math.random() < 0.55 ? 'hjort' : 'villsvin', rand(26, 42));
        }
        // funn
        for (const f of g.findsPlanned) {
            if (f.at > 0 && g.t >= f.at) {
                f.at = -1;
                for (let tries = 0; tries < 12; tries++) {
                    const x = p.x + rand(14, 30);
                    if (water(g, x) < ground(g, x) - 0.2) {
                        g.items.push({ kind: 'funn', x, m: ground(g, x), vx: 0, vm: 0, g: 0, rot: 0, life: 30, find: f.find });
                        io.toast('Noe glimter på bakken foran deg.');
                        break;
                    }
                }
            }
        }
    }

    // --- nøttebusker ---
    for (const b of g.bushes) {
        if (Math.abs(b.x - p.x) > 60) continue;
        if (b.nuts < 3) {
            b.t += dt * (g.event?.id === 'notter' ? 4 : 1);
            if (b.t > 7) {
                b.t = 0;
                b.nuts++;
            }
        }
        if (live && b.nuts > 0 && Math.abs(b.x - p.x) < 1.4 && water(g, b.x) < ground(g, b.x)) {
            const n = b.nuts;
            b.nuts = 0;
            b.t = 0;
            for (let i = 0; i < n; i++) feed(g, io, 2.5, 3, b.x, ground(g, b.x) + 1.5, i === 0 ? 'NØTTER ' : '', '#ffcf7a');
            io.sfx.eat();
            crumbs(g, b.x, ground(g, b.x) + 1.4, 6, '#a0522d');
        }
    }

    // --- ting ---
    for (const it of g.items) {
        it.life -= dt;
        if (it.kind === 'fisk') {
            it.vm -= it.g * dt;
            it.x += it.vx * dt;
            it.m += it.vm * dt;
            it.rot = Math.atan2(-it.vm, Math.abs(it.vx) + 0.1);
            if (it.vm < 0 && it.m < water(g, it.x)) {
                it.dead = true;
                drops(g, it.x, it.m, 5);
            }
            if (it.vm < 0 && it.m < ground(g, it.x)) {
                it.m = ground(g, it.x);
                it.vx = 0;
                it.vm = 0;
                it.g = 0;
            }
        }
        if (it.life <= 0) it.dead = true;
        if (!live || it.dead) continue;
        const dx = it.x - p.x;
        const dm = it.m - (p.m + 0.9);
        const r = it.kind === 'sel' ? 2 : 1.3;
        if (dx * dx + dm * dm * 0.6 < r * r) {
            it.dead = true;
            if (it.kind === 'skjell') {
                g.stats.shells++;
                feed(g, io, 6, 5, it.x, it.m, '', '#fff');
                io.sfx.shell(g.combo);
                crumbs(g, it.x, it.m + 0.3, 5, '#e8e0d0');
            } else if (it.kind === 'fisk') {
                feed(g, io, 12, 15, it.x, it.m, 'FISK! ', '#9fe3ff');
                io.sfx.shell(g.combo + 4);
                drops(g, it.x, it.m, 8);
            } else if (it.kind === 'sel') {
                feed(g, io, 24, 30, it.x, it.m, 'SEL! ', '#bfe3f0');
                io.sfx.kill();
                g.stats.kills++;
            } else if (it.kind === 'funn' && it.find) {
                const f = it.find;
                g.score += 150;
                g.stats.finds.push(f.id);
                text(g, it.x, it.m + 2.6, `FUNN! +150`, '#ffd43b', 2.2);
                io.banner(`${f.icon} ${f.name.toUpperCase()}`, f.fact, '#b07d1a');
                io.sfx.find();
                buzz([20, 30, 20, 30, 60]);
                for (let i = 0; i < 16; i++)
                    g.parts.push({ type: 'spark', x: it.x, m: it.m + 0.6, vx: rand(-8, 8), vm: rand(2, 10), g: 10, life: rand(0.5, 1), max: 1, size: rand(0.2, 0.4), color: '#ffe27a' });
            }
            buzz(8);
        }
    }
    g.items = g.items.filter((i) => !i.dead && Math.abs(i.x - p.x) < 80);

    // --- dyr ---
    for (const a of g.animals) {
        a.t += dt;
        const gx = ground(g, a.x);
        if (a.state === 'dead') {
            a.vm -= 20 * dt;
            a.m = Math.max(gx, a.m + a.vm * dt);
            continue;
        }
        const d = p.x - a.x;
        const dist = Math.abs(d);
        if (a.kind === 'hjort') {
            if (a.state === 'graze') {
                a.vx = lerp(a.vx, Math.sin(a.t * 0.8) * 1.2, dt * 2);
                if (dist < 11 && live) {
                    a.state = 'flee';
                    a.t = 0;
                }
            } else if (a.state === 'flee') {
                a.vx = lerp(a.vx, -Math.sign(d || 1) * 14, dt * 5);
                if (a.t > 2.6) {
                    a.state = 'graze';
                    a.t = 0;
                }
            }
        } else {
            if (a.state === 'graze') {
                a.vx = lerp(a.vx, Math.sin(a.t) * 1.5, dt * 2);
                if (dist < 16 && live) {
                    a.state = 'charge';
                    a.t = 0;
                    a.vx = Math.sign(d) * 2;
                    text(g, a.x, gx + 3, '!', '#ff5a4a', 2.6);
                    io.sfx.warn();
                }
            } else if (a.state === 'charge') {
                a.vx = lerp(a.vx, Math.sign(a.vx || d) * 12.5, dt * 3);
                if (live && dist < 1.6 && Math.abs(p.m - gx) < 1.5) {
                    if (hurt(g, io, 15, 'boar')) {
                        p.kx = Math.sign(a.vx) * 14;
                        p.squash = 0.4;
                    }
                }
                if (a.t > 3.2) {
                    a.state = 'recover';
                    a.t = 0;
                }
            } else if (a.state === 'recover') {
                a.vx = lerp(a.vx, 0, dt * 3);
                if (a.t > 1.6) {
                    a.state = 'graze';
                    a.t = 0;
                }
            }
        }
        // dyr går ikke ut i sjøen
        const nx = a.x + a.vx * dt;
        if (water(g, nx) > ground(g, nx) - 0.1) {
            a.vx = -a.vx * 0.5;
            if (a.state === 'charge') a.state = 'recover';
        } else a.x = nx;
        if (Math.abs(a.vx) > 0.3) a.face = Math.sign(a.vx);
        a.m = ground(g, a.x);
    }
    g.animals = g.animals.filter((a) => Math.abs(a.x - p.x) < 90 && !(a.state === 'dead' && a.t > 4));

    // --- spyd ---
    for (const sp of g.spears) {
        if (sp.stuck > 0) {
            sp.stuck -= dt;
            continue;
        }
        sp.vm -= 18 * dt;
        sp.x += sp.vx * dt;
        sp.m += sp.vm * dt;
        sp.rot = Math.atan2(sp.vm * VS, sp.vx);
        for (const a of g.animals) {
            if (a.state === 'dead') continue;
            const h = a.kind === 'hjort' ? 1.6 : 0.9;
            if (Math.abs(sp.x - a.x) < 1.7 && sp.m > a.m - 0.2 && sp.m < a.m + h + 0.6) {
                a.state = 'dead';
                a.t = 0;
                a.vm = 5;
                sp.stuck = 0.01;
                g.stats.kills++;
                const big = a.kind === 'hjort';
                feed(g, io, big ? 32 : 26, big ? 50 : 40, a.x, a.m + 1, big ? 'HJORT! ' : 'VILLSVIN! ', '#ffd43b');
                io.sfx.kill();
                io.sfx.thud();
                g.shake = Math.max(g.shake, 0.25);
                crumbs(g, a.x, a.m + 1, 10, '#8a3a2a');
                buzz(25);
            }
        }
        const gx = ground(g, sp.x);
        const wx = water(g, sp.x);
        if (sp.m < Math.max(gx, wx - 0.1) && sp.stuck === 0) {
            sp.stuck = wx > gx ? 0.01 : 2.5;
            if (wx > gx) drops(g, sp.x, wx, 4);
            else io.sfx.thud();
        }
    }
    g.spears = g.spears.filter((sp) => sp.stuck === 0 || sp.stuck > 0.02);

    // --- partikler og tekst ---
    const e = g.event?.id;
    if ((e === 'storm' || s.phase === 'wave') && Math.random() < dt * 40)
        g.parts.push({ type: 'rain', x: g.camX + rand(-30, 34), m: g.camM + 12, vx: -8, vm: -38, g: 0, life: 1.2, max: 1.2, size: 1, color: '#dfe8f0' });
    for (const pt of g.parts) {
        pt.life -= dt;
        pt.vm -= pt.g * dt;
        pt.x += pt.vx * dt;
        pt.m += pt.vm * dt;
        if (pt.type === 'rain' && pt.m < ground(g, pt.x)) pt.life = 0;
    }
    g.parts = g.parts.filter((pt) => pt.life > 0);
    for (const t of g.texts) {
        t.life -= dt;
        t.m += dt * 2.2;
    }
    g.texts = g.texts.filter((t) => t.life > 0);
    g.shake = Math.max(0, g.shake - dt);
    g.flash = Math.max(0, g.flash - dt);
}

function nearestWaterDist(g: Game) {
    for (let d = 0; d < 60; d += 1) {
        if (water(g, g.p.x - d) > ground(g, g.p.x - d)) return d;
        if (water(g, g.p.x + d) > ground(g, g.p.x + d)) return d;
    }
    return 60;
}

/** Står spilleren på en holme? Vann øst for deg (før land) betyr ja. */
function onHolme(g: Game) {
    if (g.p.depth > 0.1) return false;
    for (let x = g.p.x + 1; x < g.p.x + 70; x += 1) if (water(g, x) > ground(g, x) + 0.15) return true;
    return false;
}

/** Utviklingshjelp: hopp til et år og plasser følget i fjæra. */
function jumpTo(g: Game, year: number) {
    g.year = year;
    g.sea = seaAtYear(year);
    g.t = ((Y0 - year) / (Y0 - Y1)) * RUN_SECONDS;
    for (const id of ['puls1', 'puls2', 'storegga'] as EventId[]) {
        const y = id === 'puls1' ? 10380 : id === 'puls2' ? 8460 : 8190;
        if (year < y) g.done.add(id);
    }
    let x = WORLD - 5;
    while (x > 10 && ground(g, x) > g.sea + 1.2) x -= 1;
    g.p.x = x + 2;
    g.p.m = ground(g, g.p.x);
    g.camX = g.p.x;
    for (const f of g.followers) {
        f.x = g.p.x - 2;
        f.m = g.p.m;
    }
}

/** Nærmeste punkt med tørt land (x), eller null. Øst vinner ved likt. */
function nearestLand(g: Game): number | null {
    for (let d = 0; d < 160; d += 1) {
        const e = g.p.x + d;
        if (e < WORLD && water(g, e) < ground(g, e) - 0.1) return e;
        const w = g.p.x - d;
        if (w > 0 && water(g, w) < ground(g, w) - 0.1) return w;
    }
    return null;
}

function throwSpear(g: Game, io: IO) {
    const p = g.p;
    if (io.mode !== 'play' || p.spearCd > 0 || p.depth > 0.75) return;
    p.spearCd = 0.85;
    // Sikte-hjelp: nærmeste levende dyr foran deg innenfor 32 enheter.
    let best: Animal | null = null;
    for (const a of g.animals) {
        if (a.state === 'dead') continue;
        const d = (a.x - p.x) * p.face;
        if (d > 1 && d < 32 && (!best || d < (best.x - p.x) * p.face)) best = a;
    }
    const vx = p.face * 26;
    let vm = 7;
    if (best) {
        const lead = best.x + best.vx * (Math.abs(best.x - p.x) / 26);
        const t = Math.max(0.12, Math.abs(lead - p.x) / 26);
        const dm = best.m + 0.8 - (p.m + 1.6);
        vm = (dm + 0.5 * 18 * t * t) / t;
    }
    g.spears.push({ x: p.x + p.face * 0.6, m: p.m + 1.6, vx, vm, stuck: 0, rot: 0 });
    p.squash = 0.3;
    io.sfx.throw();
    buzz(10);
}

// ---------------------------------------------------------------------------
// Tegning
// ---------------------------------------------------------------------------

// Skjermgeometri deles med input-omregningen (peker -> verden).
let viewU = 20;
let viewW = 800;

const MOODS: Record<string, [number[], number[]]> = {
    base: [[126, 176, 214], [236, 222, 190]],
    storm: [[70, 82, 98], [150, 160, 170]],
    stille: [[176, 198, 214], [242, 236, 222]],
    storegga: [[92, 88, 110], [214, 170, 140]],
    notter: [[150, 180, 200], [246, 214, 160]],
    sel: [[110, 160, 200], [214, 232, 238]],
    outro: [[150, 170, 190], [220, 225, 228]],
};
const mood = { top: [126, 176, 214], bot: [236, 222, 190] };

const emojiCache = new Map<string, HTMLCanvasElement>();
function emoji(e: string, px: number) {
    const size = Math.max(10, Math.round(px / 4) * 4);
    const key = `${e}|${size}`;
    let c = emojiCache.get(key);
    if (!c) {
        c = document.createElement('canvas');
        c.width = c.height = Math.ceil(size * 1.35);
        const x = c.getContext('2d');
        if (x) {
            x.font = `${size}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            x.fillText(e, c.width / 2, c.height / 2 + size * 0.06);
        }
        emojiCache.set(key, c);
    }
    return c;
}

function render(g: Game, view: ArcadeView, mode: Mode) {
    const { ctx, w: W, h: H, dpr } = view;
    const U = H / 24; // skjermpiksler per enhet
    viewU = U;
    viewW = W;
    const e = mode === 'outro' ? 'outro' : g.storegga.phase !== 'none' ? 'storegga' : g.event?.id ?? 'base';
    const m = MOODS[e] ?? MOODS.base;
    for (let i = 0; i < 3; i++) {
        mood.top[i] = lerp(mood.top[i], m[0][i], 0.03);
        mood.bot[i] = lerp(mood.bot[i], m[1][i], 0.03);
    }
    const rgb = (a: number[]) => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, rgb(mood.top));
    sky.addColorStop(0.85, rgb(mood.bot));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (g.shake > 0) {
        const k = g.shake * 6;
        shx = rand(-k, k);
        shy = rand(-k, k);
    }
    const SX = (x: number) => (x - g.camX) * U + W * 0.42 + shx;
    const SY = (mm: number) => H * 0.64 - (mm - g.camM) * VS * U + shy;

    // sol og fjerne åser (parallakse)
    ctx.fillStyle = 'rgba(255,246,214,.7)';
    ctx.beginPath();
    ctx.arc(W * 0.8, H * 0.2, U * 2.2, 0, 7);
    ctx.fill();
    ridge(ctx, W, H, g.camX * U * 0.08, H * 0.5, [H * 0.07, H * 0.035], 'rgba(96,128,150,.35)');
    ridge(ctx, W, H, g.camX * U * 0.18 + 300, H * 0.56, [H * 0.05, H * 0.03], 'rgba(70,104,96,.45)');

    // terreng
    const x0 = g.camX - (W * 0.42) / U - 2;
    const x1 = g.camX + (W * 0.58) / U + 2;
    const step = 4 / U;
    ctx.beginPath();
    ctx.moveTo(SX(x0), H + 10);
    for (let x = x0; x <= x1; x += step) ctx.lineTo(SX(x), SY(ground(g, x)));
    ctx.lineTo(SX(x1), H + 10);
    ctx.closePath();
    const earth = ctx.createLinearGradient(0, SY(g.camM + 3), 0, H);
    earth.addColorStop(0, '#9a7a4c');
    earth.addColorStop(1, '#5e4428');
    ctx.fillStyle = earth;
    ctx.fill();
    // gress-kant
    ctx.lineJoin = 'round';
    ctx.lineWidth = U * 0.55;
    ctx.strokeStyle = '#6aa04a';
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) {
        const gy = ground(g, x);
        const X = SX(x);
        const Y = SY(gy) + U * 0.22;
        if (x === x0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, U * 0.12);
    ctx.strokeStyle = INK;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) {
        const X = SX(x);
        const Y = SY(ground(g, x));
        if (x === x0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
    }
    ctx.stroke();

    // trær og busker (druknede trær blir stubber)
    for (const t of g.trees) {
        if (t.x < x0 - 3 || t.x > x1 + 3) continue;
        const gy = ground(g, t.x);
        const wet = water(g, t.x) > gy + 0.3;
        drawTree(ctx, SX(t.x), SY(gy), U, t.kind, t.s, wet);
    }
    for (const b of g.bushes) {
        if (b.x < x0 - 3 || b.x > x1 + 3) continue;
        const gy = ground(g, b.x);
        drawBush(ctx, SX(b.x), SY(gy), U, b.nuts, water(g, b.x) > gy + 0.2);
    }

    // leirer
    for (const c of g.camps) {
        if (c.x < x0 - 4 || c.x > x1 + 4) continue;
        const wet = water(g, c.x) > c.m + 0.3;
        drawCamp(ctx, SX(c.x), SY(c.m), U, wet, g.t, c.gen);
    }

    // ting
    for (const it of g.items) {
        const X = SX(it.x);
        const Y = SY(it.m);
        const blink = it.life < 2 && Math.floor(it.life * 8) % 2 === 0;
        if (blink) continue;
        if (it.kind === 'skjell') drawShell(ctx, X, Y, U, it.rot);
        else if (it.kind === 'fisk') drawEmoji(ctx, '🐟', X, Y - U * 0.3, U * 1.5, it.rot, it.vx > 0);
        else if (it.kind === 'sel') drawEmoji(ctx, '🦭', X, Y - U * 0.6, U * 2.2, 0, false);
        else if (it.kind === 'funn' && it.find) {
            const bob = Math.sin(g.t * 4) * U * 0.2;
            ctx.fillStyle = 'rgba(255,226,122,.45)';
            ctx.beginPath();
            ctx.arc(X, Y - U * 0.9 + bob, U * (1.2 + Math.sin(g.t * 6) * 0.15), 0, 7);
            ctx.fill();
            drawEmoji(ctx, it.find.icon, X, Y - U * 0.9 + bob, U * 1.5, 0, false);
        }
    }

    // dyr
    for (const a of g.animals) {
        const X = SX(a.x);
        const Y = SY(a.m);
        const bob = a.state === 'dead' ? 0 : Math.abs(Math.sin(a.t * (Math.abs(a.vx) > 3 ? 14 : 3))) * U * 0.15;
        const rot = a.state === 'dead' ? Math.PI / 2 * -a.face : 0;
        // emojiene ser mot venstre - speil når dyret går østover
        drawEmoji(ctx, a.kind === 'hjort' ? '🦌' : '🐗', X, Y - U * (a.kind === 'hjort' ? 1.3 : 0.8) - bob, U * (a.kind === 'hjort' ? 2.8 : 2.1), rot, a.face > 0);
    }

    // følget og spilleren
    for (let i = g.followers.length - 1; i >= 0; i--) {
        const f = g.followers[i];
        const swim = water(g, f.x) - ground(g, f.x) > 0.6;
        drawPerson(ctx, SX(f.x), SY(f.m), U * f.scale, f.face, f.walk, f.col, swim, false, 0, false);
    }
    const p = g.p;
    const swim = p.depth > 0.75;
    const inv = p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0;
    if (!inv) drawPerson(ctx, SX(p.x), SY(p.m), U, p.face, p.walk, '#9b3a2a', swim, true, p.squash, mode === 'dying');

    // spyd
    for (const sp of g.spears) {
        ctx.save();
        ctx.translate(SX(sp.x), SY(sp.m));
        ctx.rotate(-sp.rot);
        ctx.strokeStyle = INK;
        ctx.lineWidth = Math.max(2, U * 0.14);
        ctx.beginPath();
        ctx.moveTo(-U * 1.4, 0);
        ctx.lineTo(U * 1.1, 0);
        ctx.stroke();
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.moveTo(U * 1.1, -U * 0.18);
        ctx.lineTo(U * 1.6, 0);
        ctx.lineTo(U * 1.1, U * 0.18);
        ctx.fill();
        ctx.restore();
    }

    // vann - tegnes OPPÅ terrenget, gjennomsiktig, så druknet land synes
    ctx.beginPath();
    let started = false;
    for (let x = x0; x <= x1; x += step) {
        const wy = SY(water(g, x));
        if (!started) {
            ctx.moveTo(SX(x), wy);
            started = true;
        } else ctx.lineTo(SX(x), wy);
    }
    ctx.lineTo(SX(x1), H + 10);
    ctx.lineTo(SX(x0), H + 10);
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, SY(g.sea + 0.5), 0, SY(g.sea - 9));
    wg.addColorStop(0, 'rgba(46,128,158,.62)');
    wg.addColorStop(1, 'rgba(18,58,78,.92)');
    ctx.fillStyle = wg;
    ctx.fill();
    // bølgetopper
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = Math.max(1.5, U * 0.14);
    ctx.beginPath();
    started = false;
    for (let x = x0; x <= x1; x += step) {
        const wy = SY(water(g, x)) + Math.sin(x * 1.3 + g.t * 3) * U * 0.08;
        if (!started) {
            ctx.moveTo(SX(x), wy);
            started = true;
        } else ctx.lineTo(SX(x), wy);
    }
    ctx.stroke();

    // Storegga-bølgens skumkam
    if (g.storegga.phase === 'wave') {
        const fx = SX(g.storegga.front);
        const fy = SY(water(g, g.storegga.front - 3));
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(fx - i * U * 0.9, fy + Math.sin(g.t * 20 + i) * U * 0.2, U * (0.9 - i * 0.1), 0, 7);
            ctx.fill();
        }
    }

    // partikler
    for (const pt of g.parts) {
        const a = clamp(pt.life / pt.max, 0, 1);
        ctx.globalAlpha = pt.type === 'rain' ? 0.45 : a;
        const X = SX(pt.x);
        const Y = SY(pt.m);
        if (pt.type === 'rain') {
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(X, Y);
            ctx.lineTo(X + pt.vx * U * 0.02, Y - pt.vm * U * 0.02);
            ctx.stroke();
        } else if (pt.type === 'bubble') {
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(X, Y, pt.size * U, 0, 7);
            ctx.stroke();
        } else {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(X, Y, pt.size * U * (pt.type === 'dust' ? 1.5 - a : 1), 0, 7);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // flytende tekst
    for (const t of g.texts) {
        ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2.5);
        const pop = 1 + Math.max(0, t.life - t.max + 0.15) * 3;
        outlined(ctx, t.t, SX(t.x), SY(t.m), t.size * U * pop, t.color, t.rot);
    }
    ctx.globalAlpha = 1;

    // I vannet: vis veien til nærmeste tørre land, så eleven aldri svømmer i blinde.
    if (mode === 'play' && g.p.depth > 0.3) {
        const land = nearestLand(g);
        if (land !== null) {
            const d = land - g.p.x;
            const onScreen = SX(land) > 40 && SX(land) < W - 40;
            if (!onScreen) {
                const right = d > 0;
                const ax = right ? W - 60 : 60;
                const ay = H * 0.5 + Math.sin(g.t * 6) * 4;
                ctx.save();
                ctx.translate(ax + (right ? 1 : -1) * Math.sin(g.t * 8) * 5, ay);
                ctx.fillStyle = '#ffd43b';
                ctx.strokeStyle = INK;
                ctx.lineWidth = 3;
                ctx.beginPath();
                const sgn = right ? 1 : -1;
                ctx.moveTo(sgn * 26, 0);
                ctx.lineTo(sgn * -2, -20);
                ctx.lineTo(sgn * -2, -9);
                ctx.lineTo(sgn * -24, -9);
                ctx.lineTo(sgn * -24, 9);
                ctx.lineTo(sgn * -2, 9);
                ctx.lineTo(sgn * -2, 20);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                outlined(ctx, `LAND ${Math.round(Math.abs(d) * 10)} m`, ax - sgn * 10, ay + 34, 16, '#fff');
            }
        }
    }

    // tråleren i utspillet: i dag fisker den der dere bodde
    if (mode === 'outro') {
        const tx = g.p.x - 118 + g.outro * 1.5;
        drawTrawler(ctx, SX(tx), SY(water(g, tx)), U, g.t);
        if (g.outro > 2.2) {
            ctx.globalAlpha = Math.min(1, (g.outro - 2.2) * 1.5);
            outlined(ctx, 'I DAG', SX(tx), SY(water(g, tx)) - U * 5.5, U * 1.3, '#ffd43b', -0.05);
            ctx.globalAlpha = 1;
        }
    }

    // minikart
    drawMinimap(ctx, g, W, H, U);

    // overlegg
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (g.flash > 0) {
        ctx.fillStyle = `rgba(255,80,60,${g.flash * 1.1})`;
        ctx.fillRect(0, 0, W, H);
    }
    if (mode === 'play' && g.hunger < 25) {
        const a = (0.25 - g.hunger / 100) * 1.5 * (0.6 + 0.4 * Math.sin(g.t * 8));
        const rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
        rg.addColorStop(0, 'rgba(180,0,0,0)');
        rg.addColorStop(1, `rgba(180,0,0,${Math.max(0, a)})`);
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
    }
}

function ridge(ctx: CanvasRenderingContext2D, W: number, H: number, o: number, base: number, amp: number[], color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 8) {
        const X = x + o;
        ctx.lineTo(x, base - amp[0] * (1 + Math.sin(X * 0.004)) - amp[1] * Math.sin(X * 0.013 + 1.3));
    }
    ctx.lineTo(W + 8, H);
    ctx.closePath();
    ctx.fill();
}

function outlined(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, size: number, fill: string, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.font = `900 ${size}px Outfit, Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.22;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.strokeText(t, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(t, 0, 0);
    ctx.restore();
}

function drawEmoji(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, size: number, rot: number, flip: boolean) {
    const c = emoji(e, size * 1.5);
    const s = size * 1.35;
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(c, -s / 2, -s / 2, s, s);
    ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, U: number, kind: 0 | 1 | 2, s: number, wet: boolean) {
    ctx.lineWidth = Math.max(1.2, U * 0.1);
    ctx.strokeStyle = INK;
    if (wet) {
        // druknet skog: bare stubben står igjen
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x - U * 0.3, y - U * 1.1, U * 0.6, U * 1.1);
        ctx.strokeRect(x - U * 0.3, y - U * 1.1, U * 0.6, U * 1.1);
        return;
    }
    const h = U * 5 * s;
    ctx.fillStyle = kind === 1 ? '#e8e4da' : '#6b4a2b';
    ctx.fillRect(x - U * 0.22, y - h * 0.45, U * 0.44, h * 0.45);
    if (kind === 0) {
        // furu
        ctx.fillStyle = '#2f5d3a';
        for (let i = 0; i < 3; i++) {
            const ty = y - h * (0.3 + i * 0.22);
            const r = U * (1.9 - i * 0.45) * s;
            ctx.beginPath();
            ctx.moveTo(x - r, ty);
            ctx.lineTo(x, ty - h * 0.35);
            ctx.lineTo(x + r, ty);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    } else {
        // bjørk og hassel: runde kroner
        ctx.fillStyle = kind === 1 ? '#8fbf5a' : '#5f9a45';
        ctx.beginPath();
        ctx.arc(x - U * 0.8 * s, y - h * 0.62, U * 1.3 * s, 0, 7);
        ctx.arc(x + U * 0.8 * s, y - h * 0.66, U * 1.2 * s, 0, 7);
        ctx.arc(x, y - h * 0.85, U * 1.4 * s, 0, 7);
        ctx.fill();
        ctx.stroke();
    }
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, U: number, nuts: number, wet: boolean) {
    if (wet) return;
    ctx.fillStyle = '#4f8a3c';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.2, U * 0.1);
    ctx.beginPath();
    ctx.arc(x - U * 0.6, y - U * 0.7, U * 0.8, 0, 7);
    ctx.arc(x + U * 0.6, y - U * 0.7, U * 0.8, 0, 7);
    ctx.arc(x, y - U * 1.2, U * 0.9, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a0662a';
    for (let i = 0; i < nuts; i++) {
        ctx.beginPath();
        ctx.arc(x + (i - 1) * U * 0.6, y - U * (0.9 + (i % 2) * 0.4), U * 0.26, 0, 7);
        ctx.fill();
        ctx.stroke();
    }
}

function drawShell(ctx: CanvasRenderingContext2D, x: number, y: number, U: number, rot: number) {
    ctx.save();
    ctx.translate(x, y - U * 0.3);
    ctx.rotate(rot);
    ctx.fillStyle = '#f1e6d2';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, U * 0.09);
    ctx.beginPath();
    ctx.moveTo(0, U * 0.3);
    ctx.arc(0, U * 0.3, U * 0.6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(34,32,28,.45)';
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(0, U * 0.3);
        ctx.lineTo(i * U * 0.35, -U * 0.2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCamp(ctx: CanvasRenderingContext2D, x: number, y: number, U: number, wet: boolean, t: number, gen: number) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.2, U * 0.1);
    if (wet) {
        // sunket leir: sammenrast hytte og ringen av stein fra ildstedet
        ctx.fillStyle = '#5a4a38';
        ctx.beginPath();
        ctx.moveTo(x - U * 1.4, y);
        ctx.lineTo(x - U * 0.2, y - U * 0.8);
        ctx.lineTo(x + U * 1.2, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#8a8a86';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(x + U * 2 + i * U * 0.45, y - U * 0.12, U * 0.2, 0, 7);
            ctx.fill();
        }
        ctx.globalAlpha = 0.7;
        outlined(ctx, `leir ${gen}`, x, y - U * 1.5, U * 0.8, '#cfe8f2');
        ctx.globalAlpha = 1;
        return;
    }
    ctx.fillStyle = '#b08a5a';
    ctx.beginPath();
    ctx.moveTo(x - U * 1.4, y);
    ctx.lineTo(x, y - U * 2.6);
    ctx.lineTo(x + U * 1.4, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath();
    ctx.moveTo(x - U * 0.4, y);
    ctx.lineTo(x, y - U * 1.1);
    ctx.lineTo(x + U * 0.4, y);
    ctx.fill();
    const f = 0.8 + Math.sin(t * 17) * 0.15;
    ctx.fillStyle = '#ff9a2a';
    ctx.beginPath();
    ctx.moveTo(x + U * 1.7, y);
    ctx.quadraticCurveTo(x + U * 2, y - U * 1.2 * f, x + U * 2.3, y);
    ctx.fill();
    ctx.fillStyle = '#ffd86a';
    ctx.beginPath();
    ctx.moveTo(x + U * 1.85, y);
    ctx.quadraticCurveTo(x + U * 2, y - U * 0.6 * f, x + U * 2.15, y);
    ctx.fill();
}

function drawPerson(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    U: number,
    face: number,
    walk: number,
    tunic: string,
    swim: boolean,
    hero: boolean,
    squash: number,
    dying: boolean
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);
    const sq = Math.sin(squash * 20) * squash;
    ctx.scale(1 + sq * 0.4, 1 - sq * 0.4);
    if (dying) ctx.rotate(0.5);
    ctx.lineWidth = Math.max(1.2, U * 0.11);
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    const sw = Math.sin(walk * 2.2) * 0.5;
    const skin = '#e0b58c';
    if (!swim) {
        // bein
        ctx.strokeStyle = '#5a3a22';
        ctx.lineWidth = U * 0.34;
        ctx.beginPath();
        ctx.moveTo(-U * 0.25, -U * 1.2);
        ctx.lineTo(-U * 0.25 + sw * U, -U * 0.1);
        ctx.moveTo(U * 0.25, -U * 1.2);
        ctx.lineTo(U * 0.25 - sw * U, -U * 0.1);
        ctx.stroke();
        ctx.lineWidth = Math.max(1.2, U * 0.11);
        ctx.strokeStyle = INK;
    }
    const bob = swim ? Math.sin(walk * 3) * U * 0.1 : Math.abs(Math.sin(walk * 2.2)) * U * 0.12;
    ctx.translate(0, -bob);
    // kropp (skinnkjortel)
    ctx.fillStyle = tunic;
    ctx.beginPath();
    ctx.moveTo(-U * 0.75, -U * 1.1);
    ctx.lineTo(-U * 0.55, -U * 2.9);
    ctx.lineTo(U * 0.55, -U * 2.9);
    ctx.lineTo(U * 0.75, -U * 1.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // frynser
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
        ctx.moveTo(i * U * 0.3, -U * 1.1);
        ctx.lineTo(i * U * 0.3, -U * 0.85);
    }
    ctx.stroke();
    // hode
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(U * 0.05, -U * 3.45, U * 0.62, 0, 7);
    ctx.fill();
    ctx.stroke();
    // hår
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath();
    ctx.arc(-U * 0.08, -U * 3.62, U * 0.62, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-U * 0.55, -U * 3.2, U * 0.2, U * 0.5, 0.3, 0, 7);
    ctx.fill();
    // øye
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(U * 0.32, -U * 3.48, U * 0.09, 0, 7);
    ctx.fill();
    if (hero) {
        // pannebånd og spyd
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = U * 0.16;
        ctx.beginPath();
        ctx.moveTo(-U * 0.6, -U * 3.72);
        ctx.lineTo(U * 0.62, -U * 3.62);
        ctx.stroke();
        if (!swim) {
            ctx.strokeStyle = INK;
            ctx.lineWidth = Math.max(1.5, U * 0.13);
            ctx.beginPath();
            ctx.moveTo(-U * 0.2, -U * 1.2);
            ctx.lineTo(U * 0.9, -U * 4.6);
            ctx.stroke();
            ctx.fillStyle = '#6b6b6b';
            ctx.beginPath();
            ctx.moveTo(U * 0.78, -U * 4.5);
            ctx.lineTo(U * 1.05, -U * 5.1);
            ctx.lineTo(U * 1.02, -U * 4.4);
            ctx.fill();
        }
    }
    // arm
    ctx.strokeStyle = skin;
    ctx.lineWidth = U * 0.28;
    ctx.beginPath();
    ctx.moveTo(U * 0.3, -U * 2.6);
    ctx.lineTo(U * (swim ? 1.1 : 0.55 - sw * 0.5), swim ? -U * 2.9 + Math.sin(walk * 3) * U * 0.4 : -U * 1.7);
    ctx.stroke();
    ctx.restore();
}

function drawTrawler(ctx: CanvasRenderingContext2D, x: number, y: number, U: number, t: number) {
    const bx = x + Math.sin(t * 0.5) * U * 2;
    const by = y + Math.sin(t * 2) * U * 0.15;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, U * 0.12);
    // trållinje ned i dypet
    ctx.strokeStyle = 'rgba(34,32,28,.6)';
    ctx.beginPath();
    ctx.moveTo(bx - U * 3.5, by);
    ctx.quadraticCurveTo(bx - U * 8, by + U * 6, bx - U * 12, by + U * 10);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#b8322a';
    ctx.beginPath();
    ctx.moveTo(bx - U * 4, by - U * 1.2);
    ctx.lineTo(bx + U * 4.5, by - U * 1.2);
    ctx.lineTo(bx + U * 3.5, by + U * 0.4);
    ctx.lineTo(bx - U * 3.4, by + U * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PAPER;
    ctx.fillRect(bx - U * 0.5, by - U * 3.2, U * 2.4, U * 2);
    ctx.strokeRect(bx - U * 0.5, by - U * 3.2, U * 2.4, U * 2);
    ctx.beginPath();
    ctx.moveTo(bx - U * 2.4, by - U * 1.2);
    ctx.lineTo(bx - U * 2.4, by - U * 4.8);
    ctx.lineTo(bx - U * 3.8, by - U * 1.2);
    ctx.stroke();
}

function drawMinimap(ctx: CanvasRenderingContext2D, g: Game, W: number, H: number, U: number) {
    const mw = Math.min(220, W * 0.34);
    const mh = 38;
    const mx = 10;
    const my = H - mh - 10;
    ctx.fillStyle = 'rgba(246,239,223,.92)';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 8);
    ctx.fill();
    ctx.stroke();
    const X = (x: number) => mx + 4 + (x / WORLD) * (mw - 8);
    const lo = -3;
    const hi = 24;
    const Y = (m: number) => my + mh - 4 - ((m - lo) / (hi - lo)) * (mh - 8);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 8);
    ctx.clip();
    ctx.fillStyle = '#8a6a42';
    ctx.beginPath();
    ctx.moveTo(X(0), my + mh);
    for (let x = 0; x <= WORLD; x += 8) ctx.lineTo(X(x), Y(g.terrain[x]));
    ctx.lineTo(X(WORLD), my + mh);
    ctx.fill();
    ctx.fillStyle = 'rgba(46,128,158,.75)';
    ctx.fillRect(mx, Y(g.sea), mw, my + mh - Y(g.sea));
    ctx.restore();
    // Doggerbanken
    ctx.fillStyle = INK;
    ctx.font = '700 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Doggerbanken', X(BANK_X), my + 11);
    // leirer
    ctx.fillStyle = '#3a2a1e';
    for (const c of g.camps) ctx.fillRect(X(c.x) - 1, Y(c.m) - 3, 2, 3);
    // spilleren
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(X(g.p.x), Y(g.p.m) - 2, 3.5, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillText('vest', mx + 5, my + mh - 5);
    ctx.textAlign = 'right';
    ctx.fillText('øst', mx + mw - 5, my + mh - 5);
    void U;
}

// ---------------------------------------------------------------------------
// React-skallet
// ---------------------------------------------------------------------------

interface SaveData {
    best: number;
    runs: number;
    wins: number;
    found: string[];
}
const DEFAULT_SAVE: SaveData = { best: 0, runs: 0, wins: 0, found: [] };

interface RunResult {
    score: number;
    won: boolean;
    newBest: boolean;
    rank: string;
    msg: string;
    years: number;
    people: number;
    food: number;
    camps: number;
    newFinds: Find[];
    next: [number, string] | null;
    best: number;
}

export default function HavetKommer({ onComplete }: MicroGameProps) {
    const [mode, setMode] = useState<Mode>('menu');
    const modeRef = useRef<Mode>('menu');
    const [save, updateSave] = useArcadeSave<SaveData>(GAME_ID, DEFAULT_SAVE);
    const saveRef = useRef(save);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showFinds, setShowFinds] = useState(false);
    const [synth] = useState(createArcadeSynth);
    const [sfxApi] = useState(() => makeSfx(synth));
    const [muted, setMutedState] = useState(() => synth.isMuted());
    const [pauseMsg, setPauseMsg] = useState(PAUSE_MSG[0]);
    // Lesetekst (undertitler og meldinger) går UNDER spillvinduet, så den aldri
    // dekker dyr, mat eller bølgen. Bare korte titler blinker opp i bildet.
    const [announce, announcer, feed] = useArcadeAnnouncer({ feed: true });
    const gameRef = useRef<Game | null>(null);
    const hud = {
        score: useRef<HTMLDivElement>(null),
        combo: useRef<HTMLDivElement>(null),
        bar: useRef<HTMLDivElement>(null),
        fill: useRef<HTMLDivElement>(null),
        year: useRef<HTMLDivElement>(null),
        sea: useRef<HTMLDivElement>(null),
        goal: useRef<HTMLDivElement>(null),
        spear: useRef<HTMLButtonElement>(null),
    };
    const lastHud = useRef({ s: -1, c: -1, h: -1, y: -1 });
    const completedOnce = useRef(false);
    const outcome = useRef<{ won: boolean; score: number } | null>(null);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);

    const setModeBoth = (m: Mode) => {
        modeRef.current = m;
        setMode(m);
    };

    useEffect(() => {
        gameRef.current = newGame(Math.floor(Math.random() * 1e9), saveRef.current.found);
        return () => synth.dispose();
    }, [synth]);

    const endRun = (won: boolean) => {
        const g = gameRef.current;
        if (!g) return;
        const score = Math.floor(g.score + (won ? 2500 : 0));
        const prev = saveRef.current;
        const newBest = score > prev.best;
        const found = [...prev.found];
        const newFinds: Find[] = [];
        for (const id of g.stats.finds)
            if (!found.includes(id)) {
                found.push(id);
                const f = FINDS.find((x) => x.id === id);
                if (f) newFinds.push(f);
            }
        const best = Math.max(prev.best, score);
        updateSave((s) => ({ ...s, best, runs: s.runs + 1, wins: s.wins + (won ? 1 : 0), found }));
        const sunk = g.camps.filter((c) => water(g, c.x) > c.m + 0.3).length;
        const msg = won
            ? `Dere nådde kysten av det som i dag er Danmark og Norge. ${sunk} av leirene deres ligger nå på bunnen av Nordsjøen - der trålerne fisker i dag.`
            : `${pick(DEATH[g.cause])} ${TIPS[g.cause]}`;
        setResult({
            score,
            won,
            newBest,
            rank: rankFor(RANKS, score),
            msg,
            years: Math.round(Y0 - g.year),
            people: g.followers.length + 1,
            food: g.stats.food,
            camps: g.camps.length,
            newFinds,
            next: nextRank(RANKS, best),
            best,
        });
        outcome.current = { won, score };
        setModeBoth('over');
        const reachedStoregga = g.year <= 8150;
        if ((won || reachedStoregga) && !completedOnce.current) {
            completedOnce.current = true;
            onComplete({ score: clamp(score / 15000, 0.3, 1), completed: true });
        }
    };

    const io: IO = {
        mode,
        sfx: sfxApi,
        banner: announce.banner,
        toast: announce.toast,
        die: () => {
            if (modeRef.current !== 'play') return;
            const g = gameRef.current;
            if (!g) return;
            g.hunger = 0;
            g.dying = 0;
            sfxApi.die();
            buzz(200);
            setModeBoth('dying');
        },
        win: () => {
            if (modeRef.current !== 'play') return;
            const g = gameRef.current;
            if (!g) return;
            g.outro = 0;
            announce.banner('DOGGERLAND ER BORTE', 'Folket ditt levde videre på kysten rundt Nordsjøen.', '#1f4f5f');
            sfxApi.win();
            setModeBoth('outro');
        },
    };
    const ioRef = useRef(io);
    useEffect(() => {
        ioRef.current = io;
    });

    const updateHud = (g: Game) => {
        const L = lastHud.current;
        const s = Math.floor(g.score);
        if (s !== L.s && hud.score.current) {
            hud.score.current.textContent = s.toLocaleString('nb-NO');
            L.s = s;
        }
        const c = g.combo >= 3 ? mult(g) : 0;
        if (c !== L.c && hud.combo.current) {
            hud.combo.current.textContent = `×${c} mat`;
            hud.combo.current.style.opacity = c >= 2 ? '1' : '0';
            hud.combo.current.classList.remove('bump');
            void hud.combo.current.offsetWidth;
            hud.combo.current.classList.add('bump');
            L.c = c;
        }
        const h = Math.round(clamp(g.hunger, 0, 100));
        if (h !== L.h && hud.fill.current && hud.bar.current) {
            hud.fill.current.style.width = `${h}%`;
            hud.fill.current.style.background = h > 55 ? '#7ccf5b' : h > 25 ? '#f2c233' : '#e5483a';
            hud.bar.current.classList.toggle('low', h < 25);
            L.h = h;
        }
        const y = Math.round(g.year / 10) * 10;
        if (y !== L.y && hud.year.current && hud.sea.current) {
            hud.year.current.textContent = `${y.toLocaleString('nb-NO')} år siden`;
            hud.sea.current.textContent = `Havet: +${g.sea.toFixed(1).replace('.', ',')} m`;
            if (hud.goal.current) hud.goal.current.style.width = `${((Y0 - g.year) / (Y0 - Y1)) * 100}%`;
            L.y = y;
        }
        if (hud.spear.current) hud.spear.current.classList.toggle('dim', g.p.spearCd > 0 || g.p.depth > 0.75);
    };

    const { stageRef, bindStage, bindCanvas } = useArcadeLoop({
        frame: (dt, view) => {
            const g = gameRef.current;
            if (!g) return;
            const m = modeRef.current;
            const cur = { ...ioRef.current, mode: m };
            if (m === 'play' || m === 'menu' || m === 'dying' || m === 'outro') update(g, dt, cur);
            if (m === 'dying') {
                g.dying += dt;
                if (g.dying > 1.6) endRun(false);
            }
            if (m === 'outro') {
                g.outro += dt;
                // Kameraet trekker seg vestover over de druknede leirene, og
                // havet stiger videre mot dagens nivå. Tråleren fisker der dere bodde.
                g.camX = lerp(g.camX, Math.max(60, g.p.x - 118), dt * 0.9);
                g.camM = lerp(g.camM, g.sea - 1.5, dt * 0.9);
                g.sea = lerp(g.sea, L_END + 2, dt * 0.5);
                if (g.outro > 6.5) endRun(true);
            }
            render(g, view, m);
            if (m === 'play') updateHud(g);
        },
        onHidden: () => {
            if (modeRef.current === 'play') pause();
        },
    });

    const start = () => {
        synth.unlock();
        const g = newGame(Math.floor(Math.random() * 1e9), saveRef.current.found);
        // Kun i utvikling: ?aar=8600 starter runden sent, for å teste slutten.
        if (import.meta.env.DEV) {
            const aar = Number(new URLSearchParams(window.location.search).get('aar'));
            if (aar > Y1 && aar < Y0) jumpTo(g, aar);
        }
        gameRef.current = g;
        outcome.current = null;
        lastHud.current = { s: -1, c: -1, h: -1, y: -1 };
        setResult(null);
        setShowFinds(false);
        announce.clear();
        setModeBoth('play');
        window.setTimeout(() => {
            if (modeRef.current === 'play')
                announce.banner('11 000 ÅR SIDEN', 'Hold følget i live til Doggerland er borte, 7 800 år siden. Det tar 3 200 år.', '#3f7d3a');
        }, 300);
        synth.tone(260, 520, 0.14, 'triangle', 0.1);
    };
    const pause = () => {
        if (modeRef.current !== 'play') return;
        const g = gameRef.current;
        if (g) g.input.ptrSX = null;
        setPauseMsg(pick(PAUSE_MSG));
        setModeBoth('paused');
    };
    const resume = () => setModeBoth('play');
    const toMenu = () => {
        gameRef.current = newGame(Math.floor(Math.random() * 1e9), saveRef.current.found);
        announce.clear();
        setModeBoth('menu');
    };
    const toggleMute = () => {
        const s = synth;
        s.unlock();
        s.setMuted(!s.isMuted());
        setMutedState(s.isMuted());
    };

    // input: peker på scenen = gå dit; tastatur = piler + mellomrom
    const onPointer = (e: React.PointerEvent) => {
        const g = gameRef.current;
        if (!g || modeRef.current !== 'play') return;
        const r = stageRef.current?.getBoundingClientRect();
        if (!r) return;
        if (e.type === 'pointerdown') {
            synth.unlock();
            (e.target as Element).setPointerCapture?.(e.pointerId);
            g.input.ptrSX = e.clientX - r.left;
        } else if (e.type === 'pointermove' && g.input.ptrSX !== null) g.input.ptrSX = e.clientX - r.left;
        else if (e.type === 'pointerup' || e.type === 'pointercancel') g.input.ptrSX = null;
    };
    // Selvspill (kun i utvikling, se playtest.ts). Robotene styrer med de samme
    // grepene som eleven: gå venstre/høyre og kaste spyd.
    usePlaytest('havet-kommer', () => {
        const spyd = { t: 0 };
        const styr = (fn: (g: Game) => number) => () => {
            const g = gameRef.current;
            if (!g || modeRef.current !== 'play') return;
            const target = fn(g);
            const diff = target - g.p.x;
            g.input.key = Math.abs(diff) < 0.6 ? 0 : Math.sign(diff);
        };
        const seende = (g: Game) => {
            const x = g.p.x;
            const ph = g.storegga.phase;
            if (ph === 'drawdown' || ph === 'wave') return x + 30;
            const mat = g.items
                .filter((i) => water(g, i.x) <= ground(g, i.x) + 0.5 && i.x > x - 10)
                .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
            let target = mat.length ? mat[0].x : nearestWaterDist(g) > 12 ? x - 6 : x + 4;
            const warnEast = g.islandWarned && x < g.saddle.x + 5 && x > BANK_X - 120;
            if (g.p.depth > 0.2 || onHolme(g) || warnEast) target = x + 12;
            // Dyr innen rekkevidde: snu mot det og kast.
            const dyr = g.animals.find((a) => a.state !== 'dead' && Math.abs(a.x - x) < 26);
            if (dyr && performance.now() - spyd.t > 900) {
                const dir = Math.sign(dyr.x - x) || 1;
                if (g.p.face !== dir) return x + dir;
                spyd.t = performance.now();
                throwSpear(g, { ...ioRef.current, mode: 'play' });
            }
            return target;
        };
        return {
            maksSekunder: 420,
            snapshot: () => {
                const g = gameRef.current;
                const m = modeRef.current;
                const o = outcome.current;
                return {
                    fase: m === 'menu' ? 'meny' : m === 'over' ? (o?.won ? 'vunnet' : 'tapt') : 'spiller',
                    poeng: m === 'over' && o ? o.score : Math.floor(g?.score ?? 0),
                    framdrift: g ? (Y0 - g.year) / (Y0 - Y1) : 0,
                    tid: g ? (Y0 - g.year) / YEARS_PER_SEC : 0,
                };
            },
            start: () => start(),
            bots: {
                seende: {
                    forventer: 'vinner',
                    beskrivelse: 'Plukker mat i fjæra, kaster spyd, går østover når landet blir en holme og flykter fra Storegga.',
                    tick: styr(seende),
                },
                'bare-ost': {
                    forventer: 'taper',
                    beskrivelse: 'Går rett østover hele tiden og bryr seg ikke om mat.',
                    tick: styr((g) => g.p.x + 20),
                },
            },
        };
    });

    useEffect(() => {
        const keys = new Set<string>();
        const apply = () => {
            const g = gameRef.current;
            if (!g) return;
            g.input.key = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0);
        };
        const map = (code: string) =>
            code === 'ArrowLeft' || code === 'KeyA' ? 'l' : code === 'ArrowRight' || code === 'KeyD' ? 'r' : null;
        const down = (e: KeyboardEvent) => {
            const m = modeRef.current;
            const stage = stageRef.current;
            if (!stage) return;
            // Bare når spillet er synlig - ellers skal pilene scrolle artikkelen.
            const r = stage.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            if (m === 'play') {
                const k = map(e.code);
                if (k) {
                    keys.add(k);
                    apply();
                    e.preventDefault();
                }
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                    e.preventDefault();
                    if (!e.repeat && gameRef.current) throwSpear(gameRef.current, { ...ioRef.current, mode: 'play' });
                }
                if (e.code === 'Escape' || e.code === 'KeyP') pause();
            } else if (m === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
        };
        const up = (e: KeyboardEvent) => {
            const k = map(e.code);
            if (k) {
                keys.delete(k);
                apply();
            }
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
        // pause/resume er stabile nok: de leser bare refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const playing = mode === 'play';
    const hudOn = mode === 'play' || mode === 'paused';

    return (
        <MicroGameFrame title="Havet kommer" bleed>
            <div className="p-2">
            <ArcadeStage ref={bindStage} theme={THEME} label="Havet kommer - Doggerland-spill" below={feed}>
                <canvas
                    ref={bindCanvas}
                    onPointerDown={onPointer}
                    onPointerMove={onPointer}
                    onPointerUp={onPointer}
                    onPointerCancel={onPointer}
                />

                {/* HUD */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        padding: '8px 10px 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        pointerEvents: 'none',
                        opacity: hudOn ? 1 : 0,
                        transition: 'opacity .3s',
                    }}
                >
                    <div style={{ minWidth: 86 }}>
                        <div ref={hud.score} className="arc-display arc-outline" style={{ fontSize: 28, lineHeight: 1 }}>
                            0
                        </div>
                        <div
                            ref={hud.combo}
                            className="arc-display arc-pill"
                            style={{ marginTop: 5, fontSize: 14, opacity: 0, color: INK }}
                        >
                            ×2
                        </div>
                    </div>
                    <div style={{ flex: 1, maxWidth: 230, margin: '4px auto 0' }}>
                        <div className="arc-display arc-outline" style={{ fontSize: 12, marginBottom: 3 }}>
                            Følgets metthet
                        </div>
                        <div ref={hud.bar} className="arc-bar">
                            <div ref={hud.fill} style={{ width: '100%', background: '#7ccf5b' }} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 110 }}>
                        <div ref={hud.year} className="arc-display arc-outline" style={{ fontSize: 16, lineHeight: 1.1 }}>
                            11 000 år siden
                        </div>
                        <div ref={hud.sea} className="arc-display arc-outline" style={{ fontSize: 13, color: '#bfe8ff' }}>
                            Havet: +0,0 m
                        </div>
                        <div
                            title="Mål: 7 800 år siden"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 3 }}
                        >
                            <div
                                style={{ width: 70, height: 7, border: `2px solid ${INK}`, borderRadius: 5, background: 'rgba(0,0,0,.25)', overflow: 'hidden' }}
                            >
                                <div ref={hud.goal} style={{ width: '0%', height: '100%', background: '#ffd43b' }} />
                            </div>
                            <span className="arc-display arc-outline" style={{ fontSize: 11 }}>
                                mål
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="arc-small"
                        style={{ pointerEvents: 'auto', padding: '4px 9px', fontSize: 13 }}
                        onClick={pause}
                        aria-label="Pause"
                    >
                        ❚❚
                    </button>
                </div>

                {/* spydknapp */}
                <button
                    ref={hud.spear}
                    type="button"
                    className="arc-round"
                    aria-label="Kast spyd"
                    style={{
                        right: 14,
                        bottom: 16,
                        width: 72,
                        height: 72,
                        background: '#e8a93a',
                        fontSize: 30,
                        opacity: playing ? 1 : 0,
                        pointerEvents: playing ? 'auto' : 'none',
                    }}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        synth.unlock();
                        const g = gameRef.current;
                        if (g) throwSpear(g, { ...ioRef.current, mode: 'play' });
                    }}
                >
                    🔱
                </button>

                {announcer}

                {mode === 'menu' && !showFinds && (
                    <ArcadeScreen>
                        <ArcadeLogo accent="!">HAVET KOMMER</ArcadeLogo>
                        <ArcadeTag>Doggerland, 11 000 år siden</ArcadeTag>
                        <ArcadeBigButton onClick={start}>Spill</ArcadeBigButton>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                            Rekord <b className="arc-display">{save.best.toLocaleString('nb-NO')}</b>
                            &nbsp;/&nbsp; Funn{' '}
                            <b className="arc-display">
                                {save.found.length}/{FINDS.length}
                            </b>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <ArcadeSmallButton onClick={() => setShowFinds(true)}>🏺 Havbunnsarkivet</ArcadeSmallButton>
                            <ArcadeSmallButton onClick={toggleMute} ariaLabel="Lyd av eller på">
                                {muted ? '🔇' : '🔊'}
                            </ArcadeSmallButton>
                        </div>
                        <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, lineHeight: 1.4, fontWeight: 500, opacity: 0.85 }}>
                            Mål: hold følget i live til Doggerland er borte. Hold pekeren der du vil gå - maten
                            er rikest i fjæra, men fjæra flytter seg.
                            <br />
                            Mellomrom eller 🔱: kast spyd. Piltastene går også.
                        </p>
                    </ArcadeScreen>
                )}

                {showFinds && (
                    <ArcadeScreen>
                        <div className="arc-display" style={{ fontSize: 26 }}>
                            Havbunnsarkivet
                        </div>
                        <p style={{ fontSize: 12.5, margin: '2px 0 8px', fontWeight: 500 }}>
                            Ting fiskere og forskere har fått opp fra bunnen av Nordsjøen.
                        </p>
                        <div style={{ textAlign: 'left', maxHeight: 230, overflowY: 'auto', marginBottom: 10 }}>
                            {FINDS.map((f) => {
                                const has = save.found.includes(f.id);
                                return (
                                    <div
                                        key={f.id}
                                        style={{
                                            display: 'flex',
                                            gap: 10,
                                            alignItems: 'center',
                                            padding: '6px 2px',
                                            borderBottom: '2px dashed rgba(34,32,28,.18)',
                                            opacity: has ? 1 : 0.45,
                                        }}
                                    >
                                        <div style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{has ? f.icon : '🔒'}</div>
                                        <div>
                                            <b className="arc-display" style={{ fontSize: 15, display: 'block' }}>
                                                {has ? f.name : 'Ikke funnet ennå'}
                                            </b>
                                            <span style={{ fontSize: 12 }}>{has ? f.fact : 'Let etter noe som glimter.'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <ArcadeSmallButton onClick={() => setShowFinds(false)}>Lukk</ArcadeSmallButton>
                    </ArcadeScreen>
                )}

                {mode === 'paused' && (
                    <ArcadeScreen>
                        <div className="arc-display" style={{ fontSize: 30 }}>
                            Pause
                        </div>
                        <p style={{ fontWeight: 500, margin: '8px 0 0' }}>{pauseMsg}</p>
                        <ArcadeBigButton onClick={resume}>Fortsett</ArcadeBigButton>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <ArcadeSmallButton onClick={start}>Start på nytt</ArcadeSmallButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </div>
                    </ArcadeScreen>
                )}

                {mode === 'over' && result && (
                    <ArcadeScreen>
                        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>
                            {result.won ? 'Du klarte det! Din rang' : 'Din rang'}
                        </div>
                        <div
                            className="arc-display"
                            style={{ fontSize: 'clamp(20px, 4vw, 28px)', lineHeight: 1.05, color: '#b8322a', transform: 'rotate(-2deg)', margin: '0 0 2px' }}
                        >
                            {result.rank}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <span className="arc-display" style={{ fontSize: 34, lineHeight: 1 }}>
                                {result.score.toLocaleString('nb-NO')}
                            </span>
                            {result.newBest && (
                                <span className="arc-display arc-pill arc-wig" style={{ fontSize: 14 }}>
                                    Ny rekord!
                                </span>
                            )}
                        </div>
                        <p style={{ margin: '6px 0 6px', fontWeight: 500, fontSize: 13, lineHeight: 1.35 }}>{result.msg}</p>
                        <ArcadeStats
                            items={[
                                { value: result.years.toLocaleString('nb-NO'), label: 'år' },
                                { value: result.people, label: 'i følget' },
                                { value: result.food, label: 'matbiter' },
                                { value: result.camps, label: 'leirer' },
                            ]}
                        />
                        {result.newFinds.length > 0 ? (
                            <div style={{ marginTop: 6, background: '#fff', border: `2.5px dashed ${INK}`, borderRadius: 10, padding: 5, fontWeight: 800, fontSize: 12.5 }}>
                                Nytt i arkivet: {result.newFinds.map((f) => `${f.icon} ${f.name}`).join(', ')}
                            </div>
                        ) : result.next ? (
                            <div style={{ marginTop: 6, background: '#fff', border: `2.5px dashed ${INK}`, borderRadius: 10, padding: 5, fontWeight: 800, fontSize: 12.5 }}>
                                {(result.next[0] - result.best).toLocaleString('nb-NO')} poeng til neste rang: {result.next[1]}
                            </div>
                        ) : null}
                        <ArcadeBigButton onClick={start}>Igjen!</ArcadeBigButton>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <ArcadeSmallButton onClick={() => { setShowFinds(true); toMenu(); }}>🏺 Arkivet</ArcadeSmallButton>
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </div>
                    </ArcadeScreen>
                )}
            </ArcadeStage>
            </div>
        </MicroGameFrame>
    );
}
