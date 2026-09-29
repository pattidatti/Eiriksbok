// KURS FOR GRØNLAND - spillreglene. Ren TypeScript uten React, så robotene kan
// spille hundrevis av runder i simuleringen (npx tsx) uten nettleser.
//
// Fagkjernen er breddeseiling. Vikingene hadde ikke kompass. For å finne fram over
// åpent hav holdt de seg på samme breddegrad: de seilte rett vest og målte hvor høyt
// sola sto midt på dagen. Står sola lavere enn hjemme, er du kommet for langt nord.
// Står den høyere, er du for langt sør. Havstrømmer og storm skyver skipet bort fra
// linja uten at du merker det - bare middagssola (og landemerkene i leidsagnet) avslører det.
//
// Leidsagnet i Hauksbók: fra Hernar i Norge skal man seile rett vest til Hvarf på
// Grønland. Da seiler man nord for Hjaltland (Shetland), så man bare ser det i klart
// vær, sør for Færøyene, så havet står midt i fjellsidene, og så langt sør for Island
// at man bare ser fugl og hval derfra.
//
// Koordinater: x = km seilt vestover fra Hernar, y = km nord for Hernar-linja
// (Hernar og Hvarf ligger omtrent på samme breddegrad). Kurs 0 = rett vest,
// positiv kurs = mot nord.

export const ROUTE = 2600; // km fra Hernar til Hvarf
export const DAY = 13; // sekunder spilltid per døgn
export const WATER_DAYS = 17; // drikkevann om bord (døgn)
export const BAND = 80; // hvor langt fra linja du kan være og likevel treffe Hvarf
export const MAX_HEADING = (32 * Math.PI) / 180;
const TURN_RATE = 0.62; // rad/s ved fullt ror
const VMAX = 24; // km per spillsekund ved fullt seil og god bør
export const COAST_SEEN = 170; // km før Grønland kysten kommer til syne

export const SAIL_SPEED = [0.22, 0.62, 1] as const; // revet, halvt, fullt

export type Weather = 'klart' | 'tåke' | 'storm' | 'stille';
export type Cause = 'sank' | 'is' | 'forbi' | 'tørst';
export type Mode = 'play' | 'won' | 'lost';

export interface Landmark {
    id: 'hjaltland' | 'faeroyene' | 'island' | 'hvarf';
    name: string;
    x: number;
    y: number;
    /** y-vinduet der leidsagnet stemmer når du passerer. */
    ok: [number, number];
    passed: boolean;
    right: boolean | null;
}

export interface Floe {
    id: number;
    x: number;
    y: number;
    r: number;
    hit: boolean;
}

export type GameEvent =
    | { k: 'noon'; y: number; seen: boolean }
    | { k: 'weather'; w: Weather; day: number }
    | { k: 'gustWarn' }
    | { k: 'gust'; hit: 'fullt' | 'halvt' | 'revet' }
    | { k: 'yard' }
    | { k: 'landmark'; id: Landmark['id']; right: boolean; side: 'nord' | 'sør' | 'riktig' }
    | { k: 'coast' }
    | { k: 'floe' }
    | { k: 'wave' }
    | { k: 'day'; day: number }
    | { k: 'water'; level: number }
    | { k: 'end'; won: boolean; cause?: Cause };

export interface Game {
    seed: number;
    rng: () => number;
    mode: Mode;
    cause: Cause | null;
    t: number;
    // skipet
    x: number;
    y: number;
    heading: number; // rad, 0 = vest
    turnVel: number;
    speed: number; // km/s
    sail: 0 | 1 | 2;
    yardBroken: boolean;
    water: number; // 0-1, sjø i skroget
    strain: number; // 0-1, belastning på rigg
    bailing: boolean;
    steer: number; // -1..1 fra spilleren
    // været
    plan: Weather[];
    wind: number; // 0-1
    stormPush: number; // km/s nordover (negativ = sør) i dag
    bias: number; // havstrøm km/s (hele reisen)
    daily: number[]; // daglig tilleggsdrift
    fogYaw: number;
    gustIn: number; // sekunder til neste kast varsles
    gustWarn: number; // > 0: kastet kommer om så mange sekunder
    // middagssola
    lastNoon: { y: number; day: number } | null;
    noonFlash: number;
    // leidsagnet
    marks: Landmark[];
    floes: Floe[];
    floeId: number;
    coastSeen: boolean;
    // teller
    score: number;
    valg: number;
    noonsRead: number;
    gustsReefed: number;
    gustsHit: number;
    wavesTaken: number;
    bailSeconds: number;
    maxAbsY: number;
    events: GameEvent[];
}

/** Deterministisk tilfeldighet (mulberry32) - samme seed gir samme reise. */
export function rngFrom(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function makePlan(rng: () => number): Weather[] {
    // Første to døgn er klare (eleven lærer middagssola). Så kommer vær: flere
    // stormer utover i reisen, minst én tåke og minst to stormer før døgn 10.
    const plan: Weather[] = ['klart', 'klart'];
    for (let d = 2; d < WATER_DAYS + 4; d++) {
        const r = rng();
        const storm = 0.14 + d * 0.022;
        if (plan[d - 1] === 'storm' && rng() < 0.45) plan.push('storm');
        else if (r < storm) plan.push('storm');
        else if (r < storm + 0.15 && plan[d - 1] !== 'tåke') plan.push('tåke');
        else if (r < storm + 0.24) plan.push('stille');
        else plan.push('klart');
    }
    const before10 = plan.slice(2, 10);
    if (!before10.includes('tåke')) plan[3 + Math.floor(rng() * 3)] = 'tåke';
    let storms = plan.slice(2, 10).filter((w) => w === 'storm').length;
    for (let d = 4; storms < 2 && d < 10; d += 2) {
        if (plan[d] !== 'storm' && plan[d] !== 'tåke') {
            plan[d] = 'storm';
            storms++;
        }
    }
    return plan;
}

export function newGame(seed = Math.floor(Math.random() * 1e9)): Game {
    const rng = rngFrom(seed);
    // Havstrømmen skyver hele reisen samme vei - nord eller sør - pluss litt ekstra
    // hvert døgn. Uten middagssola merker du det ikke før det er for sent.
    const dir = rng() < 0.5 ? -1 : 1;
    const bias = dir * (1.75 + rng() * 0.6);
    const daily: number[] = [];
    for (let d = 0; d < WATER_DAYS + 6; d++) daily.push((rng() - 0.5) * 2.4);
    const plan = makePlan(rng);
    return {
        seed,
        rng,
        mode: 'play',
        cause: null,
        t: 0,
        x: 0,
        y: 0,
        heading: 0,
        turnVel: 0,
        speed: 0,
        sail: 2,
        yardBroken: false,
        water: 0.05,
        strain: 0,
        bailing: false,
        steer: 0,
        plan,
        wind: 0.55,
        stormPush: 0,
        bias,
        daily,
        fogYaw: 0,
        gustIn: 4,
        gustWarn: 0,
        lastNoon: null,
        noonFlash: 0,
        marks: [
            {
                id: 'hjaltland',
                name: 'Hjaltland',
                x: 250,
                y: -62,
                ok: [-26, 42],
                passed: false,
                right: null,
            },
            {
                id: 'faeroyene',
                name: 'Færøyene',
                x: 720,
                y: 96,
                ok: [-32, 46],
                passed: false,
                right: null,
            },
            {
                id: 'island',
                name: 'Island',
                x: 1380,
                y: 300,
                ok: [-50, 62],
                passed: false,
                right: null,
            },
            {
                id: 'hvarf',
                name: 'Hvarf',
                x: ROUTE,
                y: 0,
                ok: [-BAND, BAND],
                passed: false,
                right: null,
            },
        ],
        floes: [],
        floeId: 0,
        coastSeen: false,
        score: 0,
        valg: 0,
        noonsRead: 0,
        gustsReefed: 0,
        gustsHit: 0,
        wavesTaken: 0,
        bailSeconds: 0,
        maxAbsY: 0,
        events: [],
    };
}

/** Reisen starter en morgen, ikke ved soloppgang. */
const PHASE0 = 0.22;
export const dayOf = (g: Game) => Math.floor(g.t / DAY + PHASE0);
/** 0-1 gjennom døgnet: 0 = soloppgang, 0,5 = middag, ~0,92 = solnedgang. */
export const dayPhase = (g: Game) => (g.t / DAY + PHASE0) % 1;
export const weatherOf = (g: Game) => g.plan[Math.min(g.plan.length - 1, dayOf(g))];
export const sunVisible = (g: Game) => {
    const p = dayPhase(g);
    return weatherOf(g) !== 'tåke' && p > 0.04 && p < 0.9;
};

/**
 * Middagssolas høyde i grader. Rundt 53° på Hernar-linja midt på sommeren; hver
 * 111 km nordover senker den med én grad. (Grensene i spillet er strukket så
 * forskjellen er synlig.)
 */
export const noonElevation = (y: number) => 53 - y / 26;

/** Skyggelengden på solbrettet i forhold til hakket fra Hernar (1 = riktig bredde). */
export const shadowRatio = (y: number) =>
    Math.tan(((90 - noonElevation(y)) * Math.PI) / 180) / Math.tan((37 * Math.PI) / 180);

/** Islandsbeltet: her ser du fugl og hval (ved riktig kurs eller litt nord for den). */
export function inBirdZone(g: Game) {
    return g.x > 1240 && g.x < 1540 && g.y > -60 && g.y < 150;
}

export function progress(g: Game) {
    return Math.min(1, g.x / ROUTE);
}

/** 0-1: hvor hardt spillet presser nå. */
export function pressure(g: Game) {
    const d = Math.min(1, g.t / (DAY * WATER_DAYS));
    const off = Math.min(1, Math.abs(g.y) / (BAND * 2));
    return Math.min(
        1,
        0.3 * g.wind + 0.3 * g.water + 0.25 * d + 0.15 * off + (g.gustWarn > 0 ? 0.1 : 0)
    );
}

function emit(g: Game, e: GameEvent) {
    g.events.push(e);
}

function end(g: Game, won: boolean, cause?: Cause) {
    if (g.mode !== 'play') return;
    g.mode = won ? 'won' : 'lost';
    g.cause = cause ?? null;
    if (won) {
        const daysLeft = Math.max(0, WATER_DAYS - g.t / DAY);
        g.score += 1500 + Math.round((BAND - Math.abs(g.y)) * 12) + Math.round(daysLeft * 120);
    }
    emit(g, { k: 'end', won, cause });
}

// --- Grepene eleven (og robotene) gjør ---

export function setSteer(g: Game, s: number) {
    g.steer = Math.max(-1, Math.min(1, s));
}

export function setSail(g: Game, s: number) {
    const max = g.yardBroken ? 1 : 2;
    g.sail = Math.max(0, Math.min(max, Math.round(s))) as 0 | 1 | 2;
}

export function setBailing(g: Game, on: boolean) {
    g.bailing = on;
}

// --- Oppdatering ---

function windFor(w: Weather, phase: number) {
    const swell = Math.sin(phase * Math.PI * 2) * 0.05;
    if (w === 'storm') return 0.88 + swell;
    if (w === 'stille') return 0.2 + swell;
    if (w === 'tåke') return 0.42 + swell;
    return 0.58 + swell;
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    const dayBefore = dayOf(g);
    const phaseBefore = dayPhase(g);
    g.t += dt;
    const day = dayOf(g);
    const phase = dayPhase(g);
    const w = weatherOf(g);

    if (day !== dayBefore) {
        emit(g, { k: 'day', day });
        const prev = g.plan[dayBefore];
        if (w !== prev) {
            emit(g, { k: 'weather', w, day });
            g.valg++;
        }
        if (w === 'storm') {
            g.stormPush = (g.rng() < 0.5 ? -1 : 1) * (2.2 + g.rng() * 1.6);
            g.gustIn = 1.5 + g.rng() * 2;
        } else g.stormPush = 0;
        if (day >= WATER_DAYS) return end(g, false, 'tørst');
    }

    // Vinden glir mot dagens vær.
    const target = windFor(w, phase);
    g.wind += (target - g.wind) * Math.min(1, dt * 0.9);

    // Roret: skipet dreier seg med treghet.
    let steer = g.steer;
    if (w === 'tåke') {
        // Hafvilla: uten sol eller stjerner ser ikke rormannen retningen,
        // og skipet vandrer med sjøen.
        g.fogYaw += (g.rng() - 0.5) * dt * 1.4;
        g.fogYaw *= 1 - dt * 0.15;
        steer += g.fogYaw;
    }
    g.turnVel += (steer * TURN_RATE - g.turnVel) * Math.min(1, dt * 3);
    g.heading = Math.max(-MAX_HEADING, Math.min(MAX_HEADING, g.heading + g.turnVel * dt));

    // Fart: seilet mot vinden. Vinden er i ryggen (østlig bør) - kurs rett vest er
    // best, men knarren tåler godt litt sidevind.
    const power = Math.min(1, 0.4 + g.wind * 0.75);
    const align = 1 - Math.abs(g.heading) * 0.35;
    const vTarget = VMAX * SAIL_SPEED[g.sail] * power * align;
    g.speed += (vTarget - g.speed) * Math.min(1, dt * 0.8);

    // Bevegelse + drift fra havstrøm og storm (usynlig for eleven).
    const drift = g.bias + (g.daily[day] ?? 0) + g.stormPush;
    g.x += Math.cos(g.heading) * g.speed * dt;
    g.y += Math.sin(g.heading) * g.speed * dt + drift * dt;
    g.maxAbsY = Math.max(g.maxAbsY, Math.abs(g.y));
    g.score += Math.cos(g.heading) * g.speed * dt * 0.5;

    // Vindkast i storm: varsel, så slag. Fullt seil tar inn sjø og vrir riggen.
    if (w === 'storm') {
        if (g.gustWarn > 0) {
            g.gustWarn -= dt;
            if (g.gustWarn <= 0) {
                const hit = g.sail === 2 ? 'fullt' : g.sail === 1 ? 'halvt' : 'revet';
                if (hit === 'fullt') {
                    g.water += 0.2;
                    g.strain += 0.42;
                    g.gustsHit++;
                } else if (hit === 'halvt') {
                    g.water += 0.07;
                    g.strain += 0.12;
                    g.gustsReefed++;
                    g.score += 60;
                } else {
                    g.gustsReefed++;
                    g.score += 120;
                }
                emit(g, { k: 'gust', hit });
                if (g.strain >= 1 && !g.yardBroken) {
                    g.yardBroken = true;
                    g.strain = 0;
                    g.water += 0.15;
                    if (g.sail > 1) g.sail = 1;
                    emit(g, { k: 'yard' });
                }
                g.gustIn = 2.6 + g.rng() * 2.4;
            }
        } else {
            g.gustIn -= dt;
            if (g.gustIn <= 0) {
                g.gustWarn = 1.9;
                g.valg++;
                emit(g, { k: 'gustWarn' });
            }
        }
    } else {
        g.gustWarn = 0;
        g.strain = Math.max(0, g.strain - dt * 0.05);
    }

    // Sjø i skroget. Knarren var åpen midtskips: grov sjø slår inn, mest med fullt seil.
    const rough = w === 'storm' ? 1 : w === 'klart' ? 0.25 : w === 'tåke' ? 0.2 : 0.08;
    const inflow = (0.004 + rough * (0.02 + g.sail * 0.014)) * dt;
    g.water += inflow;
    if (w === 'storm' && g.rng() < dt * 0.12) {
        g.water += 0.06;
        g.wavesTaken++;
        emit(g, { k: 'wave' });
    }
    if (g.bailing) {
        g.water -= 0.11 * dt;
        g.bailSeconds += dt;
    }
    g.water = Math.max(0, g.water);
    if (g.water >= 1) return end(g, false, 'sank');

    // Middagssola: i det sola står høyest, leses solbrettet.
    if (phaseBefore < 0.5 && phase >= 0.5) {
        const seen = w !== 'tåke';
        emit(g, { k: 'noon', y: g.y, seen });
        g.valg++;
        if (seen) {
            g.lastNoon = { y: g.y, day };
            g.noonFlash = 3.2;
            g.noonsRead++;
        }
    }
    g.noonFlash = Math.max(0, g.noonFlash - dt);

    // Landemerkene i leidsagnet.
    for (const m of g.marks) {
        if (m.passed || m.id === 'hvarf' || g.x < m.x) continue;
        m.passed = true;
        const rel = g.y;
        const right = rel >= m.ok[0] && rel <= m.ok[1];
        m.right = right;
        g.valg++;
        const side = right ? 'riktig' : rel > m.ok[1] ? 'nord' : 'sør';
        if (right) g.score += 400;
        // For nær land = skjær og brenninger.
        if (m.id === 'hjaltland' && rel < m.ok[0]) g.water += 0.28;
        if (m.id === 'faeroyene' && rel > m.ok[1] + 20) g.water += 0.22;
        emit(g, { k: 'landmark', id: m.id, right, side });
    }

    // Grønland: kysten kommer til syne. For langt nord ligger drivisen tett.
    if (!g.coastSeen && g.x > ROUTE - COAST_SEEN) {
        g.coastSeen = true;
        g.valg++;
        emit(g, { k: 'coast' });
    }
    if (g.x > ROUTE - 520 && g.y > BAND * 0.6 && g.rng() < dt * 0.9) {
        // Et isflak rett foran baugen, litt til siden.
        const f: Floe = {
            id: ++g.floeId,
            x: g.x + 90 + g.rng() * 60,
            y: g.y + (g.rng() - 0.5) * 30,
            r: 7 + g.rng() * 4,
            hit: false,
        };
        g.floes.push(f);
        g.valg++;
        emit(g, { k: 'floe' });
    }
    for (const f of g.floes) {
        if (f.hit) continue;
        if (Math.abs(f.x - g.x) < f.r && Math.abs(f.y - g.y) < f.r) {
            f.hit = true;
            g.water += 0.24;
        }
    }
    g.floes = g.floes.filter((f) => f.x > g.x - 60);

    if (g.x >= ROUTE) {
        const hvarf = g.marks[3];
        hvarf.passed = true;
        if (g.y > BAND) return end(g, false, 'is');
        if (g.y < -BAND) return end(g, false, 'forbi');
        hvarf.right = true;
        return end(g, true);
    }
}

/** Tøm hendelseskøen (komponenten leser den for lyd, tekst og effekter). */
export function drain(g: Game): GameEvent[] {
    const e = g.events;
    g.events = [];
    return e;
}
