// Spillreglene for Løp med lønna - ren TypeScript, ingen React. 3D-scenen leser
// tilstanden hver frame, og UI-et får beskjed gjennom IO-grensesnittet.
//
// Fagkjernen er én regel: sedlene i kjerra mister verdi for hvert sekund, fordi
// staten trykker nye. Prisene følger den ekte dollarkursen i Berlin fra
// 1. august til 15. november 1923, så doblingstiden krymper fra rundt 15 sekunder
// i august til rundt 5 i november. Varer holder verdien. Den som gjør lønna om
// til brød og kull med en gang, klarer seg. Den som tar pengene med hjem først,
// taper.

export type Mode = 'menu' | 'play' | 'paused' | 'ending' | 'over';
export type Cause = 'sult' | 'kulde';
export type Good = 'brod' | 'poteter' | 'kull';
export type StationId = 'fabrikk' | 'bakeri' | 'marked' | 'kullhandel' | 'hjem';

export const RUN_SECONDS = 160;
/** 1. august til 15. november 1923. */
export const DAYS = 106;
export const PAY_EVERY = 12;
export const FIRST_PAY = 1.5;
export const CART_CAP = 8;
/** Folk på plassen: 8 i august, 16 i november. */
export const PED_COUNT = 16;
export const pedsActive = (t: number) => 8 + Math.floor((dayAt(t) / DAYS) * 8.99);
export const MAX_SPEED = 7.2;
const ACCEL = 7;
const DOOR_R = 1.9;
/** Hva lønna er verdt i brød i det øyeblikket den kommer ut av luka. Reallønna faller utover høsten. */
export const wageBread = (t: number) => 5.6 - 1.2 * (dayAt(t) / DAYS);
export const FOOD_PER = 11;
export const HEAT_PER = 13;
const FOOD_DRAIN = 1.57;

export const BOUNDS = { x0: -11.3, x1: 11.3, z0: -7.6, z1: 6.9 };

export interface Station {
    id: StationId;
    label: string;
    /** Punktet foran døra der kjerra må stå. */
    door: [number, number];
    good?: Good;
}

export const STATIONS: Record<StationId, Station> = {
    fabrikk: { id: 'fabrikk', label: 'Fabrikkporten', door: [-6, -6.6] },
    kullhandel: { id: 'kullhandel', label: 'Kullhandelen', door: [4.2, -6.6], good: 'kull' },
    bakeri: { id: 'bakeri', label: 'Bakeren', door: [-10.3, -1.2], good: 'brod' },
    hjem: { id: 'hjem', label: 'Hjemme', door: [10.3, 1.6] },
    marked: { id: 'marked', label: 'Potetvogna', door: [-3.2, 2.9], good: 'poteter' },
};
export const STATION_LIST = Object.values(STATIONS);

/** Litfaßsäule midt på plassen og potetvogna - ting kjerra ikke kan kjøre gjennom. */
export const OBSTACLES: { x: number; z: number; r: number }[] = [
    { x: 3, z: -0.6, r: 1.05 },
    { x: -3.2, z: 4.6, r: 1.25 },
];

export const GOOD_LABEL: Record<Good, string> = { brod: 'brød', poteter: 'poteter', kull: 'kull' };
const RATIO: Record<Good, number> = { brod: 0.02, poteter: 0.024, kull: 0.03 };

// Dollarkursen i Berlin 1923 (mark per dollar), dag 0 = 1. august.
// Mellom punktene følger kursen en rett linje på logaritmisk skala.
const RATE: [number, number][] = [
    [0, 1.1e6],
    [31, 1.0e7],
    [61, 2.42e8],
    [75, 3.7e9],
    [92, 1.3e11],
    [106, 4.2e12],
];

export function dollarAt(day: number): number {
    const d = Math.max(0, Math.min(DAYS, day));
    for (let i = 1; i < RATE.length; i++) {
        const [d1, r1] = RATE[i];
        const [d0, r0] = RATE[i - 1];
        if (d <= d1) {
            const k = (d - d0) / (d1 - d0);
            return Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * k);
        }
    }
    return RATE[RATE.length - 1][1];
}

export const dayAt = (t: number) => (Math.min(RUN_SECONDS, Math.max(0, t)) / RUN_SECONDS) * DAYS;
export const priceAt = (good: Good, t: number) => dollarAt(dayAt(t)) * RATIO[good];

/** Sekunder spilltid før prisene dobles, akkurat nå. */
export function doublingSeconds(t: number): number {
    const a = dollarAt(dayAt(t));
    const b = dollarAt(dayAt(t + 1));
    return Math.LN2 / Math.max(1e-6, Math.log(b / a));
}

const MONTHS = ['august', 'september', 'oktober', 'november'];
const MONTH_START = [0, 31, 61, 92];
export function dateLabel(t: number): { day: number; month: string; monthIndex: number } {
    const d = Math.min(DAYS, Math.floor(dayAt(t)));
    let m = 0;
    for (let i = 0; i < MONTH_START.length; i++) if (d >= MONTH_START[i]) m = i;
    return { day: d - MONTH_START[m] + 1, month: MONTHS[m], monthIndex: m };
}

/** Kjempetall på norsk: 17 000, 3,4 millioner, 130 milliarder, 4,2 billioner. */
export function formatMark(n: number): string {
    if (n < 1e6) return Math.round(n).toLocaleString('nb-NO');
    const units: [number, string, string][] = [
        [1e12, 'billion', 'billioner'],
        [1e9, 'milliard', 'milliarder'],
        [1e6, 'million', 'millioner'],
    ];
    for (const [v, one, many] of units) {
        if (n >= v) {
            const x = n / v;
            const s =
                x >= 100
                    ? String(Math.round(x))
                    : x >= 10
                      ? x.toFixed(0)
                      : x.toFixed(1).replace('.', ',');
            return `${s.replace(/,0$/, '')} ${s === '1' ? one : many}`;
        }
    }
    return String(Math.round(n));
}

export interface Ped {
    x: number;
    z: number;
    tx: number;
    tz: number;
    speed: number;
    phase: number;
    cool: number;
    stumble: number;
    look: number;
}

export interface Particle {
    kind: 'note' | 'fly' | 'dust';
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    max: number;
    color: number;
    /** 'fly': reiser fra (x,y,z) til målet over `max` sekunder. */
    to?: [number, number, number];
    from?: [number, number, number];
    good?: Good;
}

export interface CartItem {
    good: Good;
    born: number;
}

export interface Seddel {
    id: string;
    title: string;
    text: string;
    /** Dagen seddelen dukker opp på plassen. */
    day: number;
}

// Seddelsamlingen: ekte sedler fra inflasjonsårene. Tekstene bygger på artikkelen.
export const SEDLER: Seddel[] = [
    {
        id: '100k',
        title: '100 000 mark (februar 1923)',
        text: 'Frankrike og Belgia okkuperte Ruhr i januar 1923. Regjeringen betalte de streikende arbeiderne med nytrykte penger.',
        day: 3,
    },
    {
        id: '1m',
        title: '1 million mark (august 1923)',
        text: 'I januar 1923 kostet en dollar rundt 17 000 mark. Nå var den over en million.',
        day: 14,
    },
    {
        id: '10m',
        title: '10 millioner mark',
        text: 'Arbeiderne fikk lønn to ganger om dagen, og løp for å bruke den før verdien forsvant.',
        day: 28,
    },
    {
        id: '100m',
        title: '100 millioner mark',
        text: 'En kaffekopp kunne doble i pris mens man drakk den.',
        day: 44,
    },
    {
        id: '1mrd',
        title: '1 milliard mark (oktober 1923)',
        text: 'Den som hadde spart hele livet, ble fattig på noen måneder. Pensjonister ble hardest rammet.',
        day: 60,
    },
    {
        id: '100mrd',
        title: '100 milliarder mark',
        text: 'Barn brukte verdiløse sedler som byggeklosser. Det trengtes en trillebår med penger for å kjøpe et brød.',
        day: 76,
    },
    {
        id: '1bill',
        title: '1 billion mark (november 1923)',
        text: 'Tilliten til republikken ble knust. 8. november forsøkte Hitler et kupp i München - ølhallkuppet.',
        day: 90,
    },
    {
        id: 'renten',
        title: '1 rentenmark (15. november 1923)',
        text: 'Den nye valutaen stoppet hyperinflasjonen. Én rentenmark var verdt 1 000 milliarder gamle mark.',
        day: 106,
    },
];

export interface G {
    t: number;
    cart: { x: number; z: number; vx: number; vz: number; heading: number; wheel: number };
    target: { x: number; z: number } | null;
    keys: { x: number; z: number };
    cash: number;
    cashT: number;
    /** Kontantene målt i brød i det øyeblikket de sist ble fylt på. */
    cashBread0: number;
    bundles0: number;
    items: CartItem[];
    food: number;
    heat: number;
    payReady: number;
    nextPay: number;
    payCount: number;
    score: number;
    earnedBread: number;
    boughtBread: number;
    bought: number;
    fastBuys: number;
    bumps: number;
    delivered: number;
    buyAcc: number;
    closed: Partial<Record<StationId, number>>;
    nextClose: number;
    queue: Record<StationId, number>;
    peds: Ped[];
    particles: Particle[];
    seddel: { s: Seddel; x: number; z: number; until: number } | null;
    sedlerSeen: Set<string>;
    found: Set<string>;
    flags: Set<string>;
    warnT: number;
    shake: number;
    /** Sist stasjon kjerra sto ved (for «stengt»-melding én gang per besøk). */
    at: StationId | null;
    cause: Cause;
    /** Lønninger på rad som ble brukt opp innen 8 sekunder. */
    streak: number;
    streakCounted: boolean;
    bestStreak: number;
    /** Lommetyven: kommer fra september når det ligger sedler i kjerra. */
    thief: { x: number; z: number; on: boolean; flee: number; until: number };
    nextThief: number;
    stolen: number;
}

export interface Sfx {
    whistle: () => void;
    cash: () => void;
    buy: (mult: number) => void;
    unload: () => void;
    bump: () => void;
    closed: () => void;
    empty: () => void;
    seddel: () => void;
    warn: () => void;
    tick: () => void;
    lose: () => void;
    win: () => void;
}

export interface IO {
    sfx: Sfx;
    banner: (t: string, s?: string, color?: string) => void;
    toast: (t: string) => void;
    float: (t: string, x: number, y: number, z: number, color?: string) => void;
    lose: (cause: Cause) => void;
    win: () => void;
}

function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}
const rand = rng(1923);

function randomSpot(): [number, number] {
    for (let k = 0; k < 20; k++) {
        const x = BOUNDS.x0 + 1 + rand() * (BOUNDS.x1 - BOUNDS.x0 - 2);
        const z = BOUNDS.z0 + 1 + rand() * (BOUNDS.z1 - BOUNDS.z0 - 2);
        if (OBSTACLES.every((o) => Math.hypot(x - o.x, z - o.z) > o.r + 0.8)) return [x, z];
    }
    return [0, 2];
}

function newPed(i: number): Ped {
    const [x, z] = randomSpot();
    const [tx, tz] = randomSpot();
    return {
        x,
        z,
        tx,
        tz,
        speed: 0.9 + rand() * 0.8,
        phase: rand() * 6,
        cool: 0,
        stumble: 0,
        look: i,
    };
}

export function newGame(): G {
    return {
        t: 0,
        cart: { x: -6, z: -3.4, vx: 0, vz: 0, heading: Math.PI, wheel: 0 },
        target: null,
        keys: { x: 0, z: 0 },
        cash: 0,
        cashT: -99,
        cashBread0: 0,
        bundles0: 0,
        items: [],
        food: 72,
        heat: 72,
        payReady: 0,
        nextPay: FIRST_PAY,
        payCount: 0,
        score: 0,
        earnedBread: 0,
        boughtBread: 0,
        bought: 0,
        fastBuys: 0,
        bumps: 0,
        delivered: 0,
        buyAcc: 0,
        closed: {},
        nextClose: 70,
        queue: { fabrikk: 0, bakeri: 1, marked: 0, kullhandel: 1, hjem: 0 },
        peds: Array.from({ length: PED_COUNT }, (_, i) => newPed(i)),
        particles: [],
        seddel: null,
        sedlerSeen: new Set(),
        found: new Set(),
        flags: new Set(),
        warnT: 0,
        shake: 0,
        at: null,
        cause: 'sult',
        streak: 0,
        streakCounted: true,
        bestStreak: 0,
        thief: { x: 0, z: 30, on: false, flee: 0, until: 0 },
        nextThief: 0,
        stolen: 0,
    };
}

// ---------------------------------------------------------------------------
// Avledede verdier (brukes av HUD, 3D og roboter)
// ---------------------------------------------------------------------------

export const cashInBread = (g: G) => g.cash / priceAt('brod', g.t);
export const canAfford = (g: G, good: Good) => g.cash >= priceAt(good, g.t);
/** 0 = sedlene er ferske, 1 = de er nesten verdiløse sammenliknet med da de kom. */
export function cashFade(g: G): number {
    if (g.cash <= 0 || g.cashBread0 <= 0) return 0;
    return Math.max(0, Math.min(1, 1 - cashInBread(g) / g.cashBread0));
}
export function bundleCount(g: G): number {
    if (g.cash <= 0) return 0;
    return Math.max(
        1,
        Math.round(
            g.bundles0 * Math.min(1, (cashInBread(g) / Math.max(0.01, g.cashBread0)) * 0.35 + 0.65)
        )
    );
}
/** Poeng-multiplikator for rekka: +25 % per lønning på rad som ble brukt med en gang (maks ×2). */
export const streakMult = (g: G) => 1 + 0.25 * Math.min(4, g.streak);
export function fastMult(g: G): number {
    const a = g.t - g.cashT;
    return a < 3 ? 3 : a < 6 ? 2 : 1;
}
export const heatDrain = (t: number) => 0.8 + 1.8 * Math.pow(dayAt(t) / DAYS, 1.3);
export const isClosed = (g: G, id: StationId) => (g.closed[id] ?? 0) > g.t;
export const distTo = (g: G, id: StationId) =>
    Math.hypot(g.cart.x - STATIONS[id].door[0], g.cart.z - STATIONS[id].door[1]);
export const atStation = (g: G, id: StationId) => distTo(g, id) < DOOR_R;

// ---------------------------------------------------------------------------
// Partikler
// ---------------------------------------------------------------------------

const NOTE_COLORS = [0x7fae6a, 0x9a78b8, 0xc9b27a, 0x6f9fb0];

export function burstNotes(g: G, x: number, y: number, z: number, n: number, speed: number) {
    for (let k = 0; k < n; k++) {
        if (g.particles.length > 180) g.particles.shift();
        const max = 1.4 + rand() * 1.2;
        g.particles.push({
            kind: 'note',
            x,
            y,
            z,
            vx: (rand() - 0.5) * speed,
            vy: 1.5 + rand() * speed * 0.6,
            vz: (rand() - 0.5) * speed,
            life: max,
            max,
            color: NOTE_COLORS[k % NOTE_COLORS.length],
        });
    }
}

function fly(
    g: G,
    good: Good,
    from: [number, number, number],
    to: [number, number, number],
    dur: number
) {
    if (g.particles.length > 180) g.particles.shift();
    g.particles.push({
        kind: 'fly',
        x: from[0],
        y: from[1],
        z: from[2],
        vx: 0,
        vy: 0,
        vz: 0,
        life: dur,
        max: dur,
        color: 0,
        from,
        to,
        good,
    });
}

export function stepParticles(g: G, dt: number) {
    const ps = g.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life -= dt;
        if (p.life <= 0) {
            ps.splice(i, 1);
            continue;
        }
        if (p.kind === 'fly' && p.from && p.to) {
            const k = 1 - p.life / p.max;
            p.x = p.from[0] + (p.to[0] - p.from[0]) * k;
            p.z = p.from[2] + (p.to[2] - p.from[2]) * k;
            p.y = p.from[1] + (p.to[1] - p.from[1]) * k + Math.sin(k * Math.PI) * 1.6;
            continue;
        }
        // Papir: faller sakte, flagrer i vinden.
        p.vy -= (p.kind === 'note' ? 3.2 : 6) * dt;
        p.vx += Math.sin(p.life * 7 + i) * 2.2 * dt;
        p.vx *= 1 - 0.9 * dt;
        p.vz *= 1 - 0.9 * dt;
        if (p.vy < -1.3 && p.kind === 'note') p.vy = -1.3;
        p.x += p.vx * dt;
        p.y = Math.max(0.03, p.y + p.vy * dt);
        p.z += p.vz * dt;
    }
}

// ---------------------------------------------------------------------------
// Grep: det eleven (og robotene) gjør
// ---------------------------------------------------------------------------

export function driveTo(g: G, x: number, z: number) {
    g.target = {
        x: Math.max(BOUNDS.x0, Math.min(BOUNDS.x1, x)),
        z: Math.max(BOUNDS.z0, Math.min(BOUNDS.z1, z)),
    };
}
export function driveToStation(g: G, id: StationId) {
    const [x, z] = STATIONS[id].door;
    driveTo(g, x, z);
}
export function setKeys(g: G, x: number, z: number) {
    g.keys.x = x;
    g.keys.z = z;
    if (x || z) g.target = null;
}

// ---------------------------------------------------------------------------
// Én frame
// ---------------------------------------------------------------------------

function once(g: G, key: string) {
    if (g.flags.has(key)) return false;
    g.flags.add(key);
    return true;
}

function moveCart(g: G, dt: number) {
    const c = g.cart;
    let dx = g.keys.x;
    let dz = g.keys.z;
    if (!dx && !dz && g.target) {
        dx = g.target.x - c.x;
        dz = g.target.z - c.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.35) {
            g.target = null;
            dx = 0;
            dz = 0;
        } else {
            // Brems inn mot målet, så kjerra stopper foran døra.
            const want = Math.min(1, d / 1.6);
            dx = (dx / d) * want;
            dz = (dz / d) * want;
        }
    }
    const len = Math.hypot(dx, dz);
    if (len > 1) {
        dx /= len;
        dz /= len;
    }
    const k = Math.min(1, ACCEL * dt);
    c.vx += (dx * MAX_SPEED - c.vx) * k;
    c.vz += (dz * MAX_SPEED - c.vz) * k;
    if (!dx && !dz) {
        c.vx *= Math.max(0, 1 - 5 * dt);
        c.vz *= Math.max(0, 1 - 5 * dt);
    }
    c.x += c.vx * dt;
    c.z += c.vz * dt;
    if (c.x < BOUNDS.x0 || c.x > BOUNDS.x1) {
        c.x = Math.max(BOUNDS.x0, Math.min(BOUNDS.x1, c.x));
        c.vx *= -0.2;
    }
    if (c.z < BOUNDS.z0 || c.z > BOUNDS.z1) {
        c.z = Math.max(BOUNDS.z0, Math.min(BOUNDS.z1, c.z));
        c.vz *= -0.2;
    }
    for (const o of OBSTACLES) {
        const ox = c.x - o.x;
        const oz = c.z - o.z;
        const d = Math.hypot(ox, oz);
        const min = o.r + 0.55;
        if (d < min && d > 1e-4) {
            c.x = o.x + (ox / d) * min;
            c.z = o.z + (oz / d) * min;
            // Gli langs hinderet i stedet for å stoppe.
            const nx = ox / d;
            const nz = oz / d;
            const vn = c.vx * nx + c.vz * nz;
            if (vn < 0) {
                c.vx -= vn * nx;
                c.vz -= vn * nz;
            }
            // Mot et mål bak hinderet: styr rundt.
            if (g.target) {
                const tx = -nz;
                const tz = nx;
                const side = Math.sign((g.target.x - c.x) * tx + (g.target.z - c.z) * tz) || 1;
                c.vx += tx * side * 3 * dt * 10;
                c.vz += tz * side * 3 * dt * 10;
            }
        }
    }
    const sp = Math.hypot(c.vx, c.vz);
    if (sp > 0.4) {
        const h = Math.atan2(c.vx, c.vz);
        let dh = h - c.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        c.heading += dh * Math.min(1, 10 * dt);
    }
    c.wheel += sp * dt * 2.4;
}

function movePeds(g: G, dt: number, io: IO) {
    const c = g.cart;
    const sp = Math.hypot(c.vx, c.vz);
    const active = pedsActive(g.t);
    for (let i = 0; i < active; i++) {
        const p = g.peds[i];
        p.cool = Math.max(0, p.cool - dt);
        p.stumble = Math.max(0, p.stumble - dt);
        // Folk ser kjerra komme og går til side - de fleste, i hvert fall.
        const ax = p.x - c.x;
        const az = p.z - c.z;
        const ad = Math.hypot(ax, az);
        if (p.stumble <= 0 && sp > 1.5 && ad < 3.6 && ad > 1e-4 && p.look % 4 !== 0) {
            const toward = -(ax * c.vx + az * c.vz) / (ad * sp);
            if (toward > 0.2) {
                // Steg vinkelrett på kjørefeltet, bort fra kjerra.
                const nx = -c.vz / sp;
                const nz = c.vx / sp;
                const side = Math.sign(ax * nx + az * nz) || 1;
                p.x += nx * side * 3.4 * dt;
                p.z += nz * side * 3.4 * dt;
            }
        }
        if (p.stumble <= 0) {
            const dx = p.tx - p.x;
            const dz = p.tz - p.z;
            const d = Math.hypot(dx, dz);
            if (d < 0.3) [p.tx, p.tz] = randomSpot();
            else {
                p.x += (dx / d) * p.speed * dt;
                p.z += (dz / d) * p.speed * dt;
                p.phase += p.speed * dt * 5;
            }
        }
        for (const o of OBSTACLES) {
            const ox = p.x - o.x;
            const oz = p.z - o.z;
            const d = Math.hypot(ox, oz);
            if (d < o.r + 0.3 && d > 1e-4) {
                p.x = o.x + (ox / d) * (o.r + 0.3);
                p.z = o.z + (oz / d) * (o.r + 0.3);
            }
        }
        const ox = p.x - c.x;
        const oz = p.z - c.z;
        const d = Math.hypot(ox, oz);
        if (d < 0.85 && d > 1e-4) {
            // Bare et krasj når kjerra kjører rett på, ikke når den stryker forbi.
            const head = sp > 0.1 ? -(ox * c.vx + oz * c.vz) / (d * sp) : 0;
            if (sp > 3.2 && p.cool <= 0 && d < 0.7 && head > 0.55) {
                // Krasj: sedler blåser av kjerra.
                p.cool = 1.6;
                p.stumble = 0.9;
                g.bumps++;
                g.shake = 0.5;
                const lost = g.cash * 0.12;
                g.cash -= lost;
                burstNotes(g, c.x, 0.9, c.z, g.cash > 0 || lost > 0 ? 14 : 4, 5);
                c.vx *= -0.35;
                c.vz *= -0.35;
                io.sfx.bump();
                if (lost > 0) io.float('SEDLER I VINDEN', c.x, 1.6, c.z, '#ff8a7a');
                if (once(g, 'bump'))
                    io.toast('Krasjer du i folk, blåser sedler av kjerra. Kjør rundt dem.');
            }
            // Folk går til side.
            p.x = c.x + (ox / d) * 0.85;
            p.z = c.z + (oz / d) * 0.85;
        }
    }
}

function collectPay(g: G, io: IO) {
    const bread = g.payReady / priceAt('brod', g.t);
    if (!g.streakCounted && g.streak > 0) {
        g.streak = 0;
        io.float('REKKA BRØT', g.cart.x, 2.4, g.cart.z, '#ff8a7a');
    }
    g.streakCounted = false;
    g.cash += g.payReady;
    g.payReady = 0;
    g.cashT = g.t;
    g.cashBread0 = cashInBread(g);
    g.bundles0 = Math.min(14, 4 + Math.floor(g.payCount * 0.7));
    const [x, z] = STATIONS.fabrikk.door;
    burstNotes(g, x, 2.2, z - 0.6, 10, 2.5);
    io.sfx.cash();
    io.float(`LØNN ≈ ${Math.floor(bread)} BRØD`, g.cart.x, 1.8, g.cart.z, '#ffe27a');
    if (once(g, 'pay1'))
        io.toast(
            'Lønna er i kjerra. Den er verdt mindre for hvert sekund - kjør til bakeren eller kullhandelen nå!'
        );
}

function buyTick(g: G, id: StationId, dt: number, io: IO) {
    const st = STATIONS[id];
    const good = st.good!;
    if (isClosed(g, id)) {
        if (g.at !== id) {
            io.sfx.closed();
            io.float('STENGT', st.door[0], 2, st.door[1], '#ff8a7a');
            io.toast(
                id === 'kullhandel'
                    ? 'Kullhandleren tar ikke imot mark i dag. Prøv igjen litt senere.'
                    : 'Bøndene vil ikke selge mat for mark lenger. Prøv den andre matbutikken.'
            );
        }
        return;
    }
    if (g.items.length >= CART_CAP) {
        if (g.at !== id) io.float('KJERRA ER FULL', g.cart.x, 1.8, g.cart.z, '#ffe27a');
        return;
    }
    const price = priceAt(good, g.t);
    if (g.cash < price) {
        if (g.at !== id && g.cash > 0) {
            io.sfx.empty();
            io.float('FOR LITE PENGER', g.cart.x, 1.8, g.cart.z, '#ff8a7a');
            if (once(g, 'empty'))
                io.toast('Sedlene var verdt for lite da du kom fram. Prisene steg mens du kjørte.');
        }
        return;
    }
    g.buyAcc += dt;
    const interval = 0.12 + 0.035 * g.queue[id];
    if (g.buyAcc < interval) return;
    g.buyAcc = 0;
    g.cash -= price;
    g.boughtBread += price / priceAt('brod', g.t);
    g.bought++;
    const m = fastMult(g);
    if (m > 1) g.fastBuys++;
    const pts = Math.round(100 * m * streakMult(g));
    g.score += pts;
    g.items.push({ good, born: g.t });
    fly(g, good, [st.door[0], 1.4, st.door[1]], [g.cart.x, 0.9, g.cart.z], 0.35);
    io.sfx.buy(m);
    io.float(
        m > 1 ? `+${pts} RASK HANDEL ×${m}` : `+${pts}`,
        g.cart.x,
        1.8,
        g.cart.z,
        m > 1 ? '#ffe27a' : '#f4efe4'
    );
    if (g.cash < price * 0.2) g.cash = 0; // småpenger som ikke kjøper noe, forsvinner
    // Hele lønna brukt innen 8 sekunder: rekka vokser.
    if (!g.streakCounted && g.t - g.cashT < 8 && g.cash < priceAt('brod', g.t)) {
        g.streakCounted = true;
        g.streak++;
        g.bestStreak = Math.max(g.bestStreak, g.streak);
        if (g.streak >= 2) {
            io.float(
                `REKKE ×${String(streakMult(g)).replace('.', ',')}`,
                g.cart.x,
                2.6,
                g.cart.z,
                '#b9f2a0'
            );
            io.sfx.seddel();
        }
        if (g.streak === 2)
            io.toast(
                'Rekke! Bruker du hele lønna med en gang flere ganger på rad, gir hver vare mer poeng.'
            );
    }
}

function unload(g: G, io: IO) {
    const keep: CartItem[] = [];
    let n = 0;
    const [x, z] = STATIONS.hjem.door;
    for (const it of g.items) {
        if (it.good === 'kull' ? g.heat <= 100 - HEAT_PER * 0.5 : g.food <= 100 - FOOD_PER * 0.5) {
            if (it.good === 'kull') g.heat = Math.min(100, g.heat + HEAT_PER);
            else g.food = Math.min(100, g.food + FOOD_PER);
            fly(g, it.good, [g.cart.x, 0.9, g.cart.z], [x + 1.4, 1.5, z], 0.3 + n * 0.06);
            n++;
        } else keep.push(it);
    }
    if (n > 0) {
        g.items = keep;
        g.delivered += n;
        g.score += 30 * n;
        io.sfx.unload();
        io.float(`+${30 * n} LEVERT`, x - 0.6, 2.2, z, '#b9f2a0');
        if (once(g, 'unload1'))
            io.toast('Levert! Mat og varme holder seg - det er bare pengene som råtner.');
    } else if (g.items.length && g.at !== 'hjem')
        io.float('LAGERET ER FULLT', x - 0.6, 2.2, z, '#ffe27a');
}

function thiefStep(g: G, dt: number, io: IO) {
    const th = g.thief;
    const day = dayAt(g.t);
    if (!th.on) {
        if (day < 38 || g.t < g.nextThief || g.cash <= 0 || !canAfford(g, 'brod')) return;
        // Tyven kommer inn fra hjørnet foran, på motsatt side av kjerra.
        th.on = true;
        th.flee = 0;
        th.until = g.t + 9;
        th.x = g.cart.x > 0 ? BOUNDS.x0 : BOUNDS.x1;
        th.z = BOUNDS.z1;
        io.float('LOMMETYV!', th.x * 0.9, 2.2, th.z - 0.5, '#ff8a7a');
        if (once(g, 'thief1'))
            io.toast(
                'En lommetyv er ute etter sedlene dine! Kjør unna - eller bruk pengene før han når deg.'
            );
        return;
    }
    const c = g.cart;
    const dx = c.x - th.x;
    const dz = c.z - th.z;
    const d = Math.hypot(dx, dz);
    if (th.flee > 0 || g.t > th.until || g.cash <= 0) {
        // Løper av plassen.
        th.flee += dt;
        const ex = th.x > 0 ? BOUNDS.x1 + 3 : BOUNDS.x0 - 3;
        th.x += Math.sign(ex - th.x) * 6 * dt;
        th.z += (BOUNDS.z1 + 2 - th.z) * dt;
        if (th.flee > 2.5) {
            th.on = false;
            th.z = 30;
            g.nextThief = g.t + 16 + rand() * 8;
        }
        return;
    }
    const sp = 4.6 + (day / DAYS) * 1.2;
    th.x += (dx / Math.max(0.01, d)) * sp * dt;
    th.z += (dz / Math.max(0.01, d)) * sp * dt;
    if (d < 0.9) {
        const lost = g.cash * 0.4;
        g.cash -= lost;
        g.stolen += lost / priceAt('brod', g.t);
        th.flee = 0.01;
        g.shake = 0.6;
        burstNotes(g, c.x, 1, c.z, 10, 3);
        io.sfx.bump();
        io.float('STJÅLET!', c.x, 2, c.z, '#ff8a7a');
    }
}

const MONTH_BANNERS: [number, string, string][] = [
    [31, 'SEPTEMBER', 'Pengetrykkeriene går døgnet rundt. Nå dobles prisene enda fortere.'],
    [
        61,
        'OKTOBER',
        'En dollar koster over 200 millioner mark. Bøndene vil helst ikke ha papirpenger.',
    ],
    [92, 'NOVEMBER', 'Prisene dobles på noen få døgn. Hold ut - regjeringen lover en ny valuta.'],
    [
        99,
        '8. NOVEMBER',
        'Hitler forsøker et kupp i München - ølhallkuppet. Det mislykkes, men krisen har gjort mange sinte på republikken.',
    ],
];

export function update(g: G, dt: number, io: IO) {
    g.t += dt;
    const day = dayAt(g.t);
    g.shake = Math.max(0, g.shake - dt * 1.6);

    if (g.t >= RUN_SECONDS) {
        io.win();
        return;
    }

    for (const [d, t, s] of MONTH_BANNERS)
        if (day >= d && once(g, 'm' + d)) {
            io.banner(t, s, '#1d1c22');
            io.sfx.tick();
        }

    // Lønna kommer ut av luka. Ligger den der fra før, legges den nye oppå.
    if (g.t >= g.nextPay) {
        g.nextPay += PAY_EVERY;
        g.payCount++;
        g.payReady += wageBread(g.t) * priceAt('brod', g.t);
        g.earnedBread += wageBread(g.t);
        io.sfx.whistle();
        if (g.payCount === 1)
            io.banner('LØNNA ER KLAR', 'Kjør kjerra til fabrikkporten og hent sedlene.', '#c8322b');
        else
            io.float(
                'LØNN!',
                STATIONS.fabrikk.door[0],
                3.2,
                STATIONS.fabrikk.door[1] - 1,
                '#ffe27a'
            );
    }

    moveCart(g, dt);
    movePeds(g, dt, io);
    thiefStep(g, dt, io);

    let here: StationId | null = null;
    for (const st of STATION_LIST) if (atStation(g, st.id)) here = st.id;
    if (here !== g.at) g.buyAcc = 0;
    if (here === 'fabrikk' && g.payReady > 0) collectPay(g, io);
    else if (here === 'hjem') unload(g, io);
    else if (here && STATIONS[here].good) buyTick(g, here, dt, io);
    g.at = here;

    // Sedler som ikke lenger kjøper et halvt brød, kastes - de er verdiløse.
    if (g.cash > 0 && g.cash < priceAt('brod', g.t) * 0.5) {
        g.cash = 0;
        burstNotes(g, g.cart.x, 1.1, g.cart.z, 8, 3);
        io.float('VERDILØST', g.cart.x, 1.8, g.cart.z, '#ff8a7a');
        if (once(g, 'rot1'))
            io.toast('Sedlene du ventet med, ble verdiløse. Folk kastet dem på gata.');
    }

    // Familien spiser og fyrer. Vinteren kommer.
    g.food -= FOOD_DRAIN * dt;
    g.heat -= heatDrain(g.t) * dt;
    const low = Math.min(g.food, g.heat);
    g.warnT -= dt;
    if (low < 25 && g.warnT <= 0) {
        g.warnT = 1.1;
        io.sfx.warn();
        if (once(g, g.food < g.heat ? 'lowfood' : 'lowheat'))
            io.toast(
                g.food < g.heat
                    ? 'Matlageret hjemme er nesten tomt!'
                    : 'Ovnen hjemme er nesten tom for kull!'
            );
    }
    if (g.food <= 0) {
        g.food = 0;
        g.cause = 'sult';
        io.lose('sult');
        return;
    }
    if (g.heat <= 0) {
        g.heat = 0;
        g.cause = 'kulde';
        io.lose('kulde');
        return;
    }

    // Køene vokser utover høsten.
    const q = day / DAYS;
    g.queue.bakeri = Math.round(1 + q * 5 + Math.sin(g.t * 0.23) * 0.8);
    g.queue.marked = Math.round(q * 3 + Math.sin(g.t * 0.31 + 1) * 0.8);
    g.queue.kullhandel = Math.round(1 + q * 4 + Math.sin(g.t * 0.19 + 2) * 0.8);

    // Fra oktober: butikker som stenger en stund.
    if (day >= 61 && g.t >= g.nextClose) {
        g.nextClose = g.t + 13 + rand() * 7;
        const opts: StationId[] = ['bakeri', 'marked', 'kullhandel'];
        const id = opts[Math.floor(rand() * opts.length)];
        const other = id === 'bakeri' ? 'marked' : id === 'marked' ? 'bakeri' : null;
        if (!other || !isClosed(g, other)) {
            g.closed[id] = g.t + 6;
            io.float('STENGT', STATIONS[id].door[0], 2.4, STATIONS[id].door[1], '#ff8a7a');
            if (once(g, 'close1'))
                io.toast(
                    `${STATIONS[id].label} har stengt en stund: bøndene og kjøpmennene vil ikke ha papirpenger.`
                );
        }
    }

    // Seddelsamlingen: en ekte seddel dukker opp på plassen i sin måned.
    if (g.seddel && g.t > g.seddel.until) g.seddel = null;
    if (!g.seddel) {
        const s = SEDLER.find((x) => x.day <= day && x.day < DAYS && !g.sedlerSeen.has(x.id));
        if (s) {
            g.sedlerSeen.add(s.id);
            const [x, z] = randomSpot();
            g.seddel = { s, x, z, until: g.t + 15 };
        }
    }
    if (g.seddel && Math.hypot(g.cart.x - g.seddel.x, g.cart.z - g.seddel.z) < 1.1) {
        const s = g.seddel.s;
        g.found.add(s.id);
        g.score += 250;
        io.sfx.seddel();
        io.float('+250 SEDDEL FUNNET', g.seddel.x, 1.6, g.seddel.z, '#e0b3ff');
        io.toast(`${s.title}: ${s.text}`);
        g.seddel = null;
    }
}
