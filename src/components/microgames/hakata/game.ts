import { seeded, type Rng } from '../sim';

// Spillreglene for Guddommelig vind - ren TypeScript, ingen React. 3D-scenen leser
// tilstanden hver frame, og UI-et får beskjed gjennom IO-grensesnittet.
//
// Hakata-bukta, sommeren 1281. Eleven står på steinmuren japanerne bygde etter det
// første mongolangrepet i 1274. Mongolene reiser stiger mot muren og klatrer.
//
// Fagkjernen (fra artikkelen: stormene blåste flåten vekk) er ÉN regel:
//   Hvis du holder mongolene på sjøen, tar stormen dem. Kommer de over muren, er de
//   trygge for stormen.
// Å skyve en stige ned gir 0 poeng nå - mennene faller i vannet og svømmer tilbake til
// skipene. Å la mannen komme til topps og hugge ham gir ære med en gang, men mens han
// står på muren, hopper mannen bak ham over og i land. Når tyfonen kommer (på et
// ukjent tidspunkt - bare vinden varsler), teller hver mann på sjøen stort.

export type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'over';
export type Cause = 'land' | 'fall';

export const SECTIONS = 3;
export const SLOTS = 3;
/** Tyfonen kommer et sted i dette vinduet (spillsekunder). */
export const STORM_MIN = 100;
export const STORM_MAX = 130;
export const STORM_LEN = 7;
export const RUN_SECONDS = STORM_MAX + STORM_LEN;
/** Så mange i land bak muren, og Hakata er tapt. */
export const LAND_MAX = 16;
export const HP_MAX = 100;

/** Poeng for et hugg på muren (ganges med kombo). */
export const KILL_PTS = 20;
/** Poeng per mann på sjøen når tyfonen slår til. */
export const SEA_PTS = 80;
export const BOMB_PTS = 40;
export const DUEL_PTS = 400;

const SWING_CD = 0.2;
/** Gangfart langs muren (m/s), og hvor langt sverdet rekker til siden. */
export const WALK_SPEED = 9;
export const REACH = 1.7;
export const WALK_MIN = -7.4;
export const WALK_MAX = 7.4;
/** Hvor lenge en mann står på muren og holder stigen før han selv går over (ingen der). */
const HOLD_S = 0.55;
/** Når en mann når toppen, hopper mannen bak ham over hvis han er så nær. */
export const BEHIND_JUMP = 0.72;
const ARROW_DMG = 22;
/** Så lenge en mann som er skjøvet i sjøen, trenger for å svømme tilbake til båtene. */
const SWIM_MIN = 10;
const SWIM_VAR = 4;
const BOMB_DMG = 30;
const MAN_DMG = 12;
const MAN_HIT_EVERY = 1.1;

// Geometri deles med 3D-scenen: murdelene langs x, stigene i hver murdel.
export const SEC_X = [-5, 0, 5];
export const SLOT_DX = [-1.25, 0, 1.25];
export const slotX = (sec: number, slot: number) => SEC_X[sec] + SLOT_DX[slot];

export interface Ladder {
    id: number;
    sec: number;
    slot: number;
    /** Reises mot muren (0 -> 1), står, eller faller bakover (skjøvet). */
    state: 'reises' | 'står' | 'faller';
    raise: number;
    fallT: number;
    /** Klatrernes framdrift 0-1, sortert synkende (først = øverst). */
    men: number[];
    /** Tid mannen på toppen har stått på muren. -1 = ingen på toppen. */
    top: number;
    /** Tid til mannen på toppen hugger etter deg. */
    hitT: number;
    /** Hvor mange som skal klatre opp denne stigen i alt (ikke reist ennå). */
    queue: number;
    queueT: number;
    climbS: number;
}

export interface Volley {
    id: number;
    sec: number;
    /** Der pilene er siktet (der eleven sto da buene ble spent). */
    x: number;
    t: number;
    max: number;
    /** Vinden tar pilene: bommer helt. */
    drift: boolean;
}

export interface Bomb {
    id: number;
    sec: number;
    slot: number;
    t: number;
    max: number;
    /** 0 = i lufta, 1 = ligger på muren. */
    state: 'lufta' | 'ligger' | 'slått';
}

export interface Duel {
    phase: 'tilbud' | 'kamp' | 'tilbake';
    sec: number;
    /** Der kjempen står på stranda. */
    x: number;
    t: number;
    champHp: number;
    /** Kjempens syklus: 'løfter' (hugg kommer), 'åpen' (kan treffes), 'vakt'. */
    champ: 'vakt' | 'løfter' | 'åpen';
    champT: number;
    flockT: number;
    won: boolean;
}

export interface Fx {
    kind: 'plask' | 'gnist' | 'smell' | 'pil' | 'over' | 'mann';
    x: number;
    y: number;
    z: number;
    life: number;
    max: number;
}

export type Target =
    | { kind: 'stige'; id: number; gesture?: Gesture }
    | { kind: 'bombe'; id: number }
    | { kind: 'kjempe' };

/** Hvilken vei sveipet gikk: vannrett = hugg, loddrett = skyv, på skrå = begge. */
export type Gesture = 'hugg' | 'skyv' | 'begge';

export interface G {
    rng: Rng;
    t: number;
    stormAt: number;
    storm: number; // sekunder inn i stormen, -1 = ikke kommet
    hp: number;
    sec: number;
    /** Eleven går fritt langs muren. `sec` er murdelen nærmest. */
    px: number;
    /** -1, 0 eller 1: tastene som holdes inne. */
    walk: number;
    /** Et mål å gå til (robotene og kantknappene), eller null. */
    goalX: number | null;
    shield: boolean;
    swingCd: number;
    /** Siste sverdslag (spilltid), hva slags, og retning på skjermen (1 = mot høyre). */
    swingAt: number;
    swingKind: Gesture;
    swingDir: number;
    freeze: number;
    ladders: Ladder[];
    volleys: Volley[];
    bombs: Bomb[];
    duel: Duel | null;
    duelOffers: number[];
    nextId: number;
    ladderT: number;
    volleyT: number;
    bombT: number;
    /** Mongoler i land bak muren. */
    land: number;
    /** Menn i sjøen akkurat nå (skjøvet ned) - hver har tid igjen til han er tilbake i båtene. */
    swim: number[];
    /** Menn på sjøen da tyfonen slo til (poengene i stormen). */
    sea: number;
    /** Alle som er skjøvet i sjøen i løpet av runden. */
    dunked: number;
    kills: number;
    pushes: number;
    deflects: number;
    duelsWon: number;
    duelsTaken: number;
    score: number;
    combo: number;
    bestCombo: number;
    valg: number;
    fx: Fx[];
    shake: number;
    flash: number;
    cause: Cause;
    ended: 'vunnet' | 'tapt' | null;
    seaBonus: number;
    done: Set<string>;
    unlocked: Set<string>;
}

export interface Sfx {
    swing: () => void;
    push: () => void;
    kill: (combo: number) => void;
    splash: () => void;
    thud: () => void;
    bows: () => void;
    arrows: (blocked: boolean) => void;
    fuse: () => void;
    boom: () => void;
    deflect: () => void;
    over: () => void;
    hurt: () => void;
    drum: () => void;
    step: () => void;
    thunder: () => void;
    win: () => void;
    lose: () => void;
}

/** Et punkt i verden som en lapp eller et lærings-øyeblikk peker på. null = ikke synlig nå. */
export type At = () => [number, number, number] | null;
export interface PinOpts {
    tone?: 'info' | 'fare' | 'bra';
    seconds?: number;
    once?: boolean;
    until?: () => boolean;
}

// Tekst går aldri i en linje under spillet. Se arcade/useArcade.tsx.
export interface IO {
    sfx: Sfx;
    banner: (t: string, color?: string) => void;
    pin: (key: string, text: string, at: At, o?: PinOpts) => void;
    beat: (key: string, title: string, text: string, at?: At, until?: () => boolean) => void;
    lesson: (key: string, text: string, weight?: number) => void;
    timeScale: () => number;
    float: (t: string, p: [number, number, number], color?: string, big?: boolean) => void;
    lose: (c: Cause) => void;
    win: () => void;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function newGame(seed = Math.floor(Math.random() * 1e9)): G {
    const rng = seeded(seed);
    const stormAt = lerp(STORM_MIN, STORM_MAX, rng());
    return {
        rng,
        t: 0,
        stormAt,
        storm: -1,
        hp: HP_MAX,
        sec: 1,
        px: 0,
        walk: 0,
        goalX: null,
        shield: false,
        swingCd: 0,
        swingAt: -9,
        swingKind: 'begge',
        swingDir: 1,
        freeze: 0,
        ladders: [],
        volleys: [],
        bombs: [],
        duel: null,
        duelOffers: [26 + rng() * 6, 58 + rng() * 8, 86 + rng() * 8],
        nextId: 1,
        ladderT: 1.2,
        volleyT: 12,
        bombT: 28,
        land: 0,
        swim: [],
        sea: 0,
        dunked: 0,
        kills: 0,
        pushes: 0,
        deflects: 0,
        duelsWon: 0,
        duelsTaken: 0,
        score: 0,
        combo: 0,
        bestCombo: 0,
        valg: 0,
        fx: [],
        shake: 0,
        flash: 0,
        cause: 'land',
        ended: null,
        seaBonus: 0,
        done: new Set(),
        unlocked: new Set(['stigen']),
    };
}

/** Vinden: 0 ved start, 1 når tyfonen slår til. Eleven ser den bare i verden. */
export const wind = (g: G) => clamp(g.t / g.stormAt, 0, 1);
export const comboMult = (c: number) => 1 + Math.floor(c / 3);
/** Står eleven på muren (ikke underveis, ikke i tvekamp)? */
export const onWall = (g: G) => !g.duel || g.duel.phase === 'tilbud';
/** Rekker sverdet dit (x langs muren)? */
export const inReach = (g: G, x: number) => onWall(g) && Math.abs(x - g.px) < REACH;
const nearestSec = (x: number) => {
    let best = 0;
    for (let s = 1; s < SECTIONS; s++) if (Math.abs(SEC_X[s] - x) < Math.abs(SEC_X[best] - x)) best = s;
    return best;
};
export const inDuel = (g: G) => !!g.duel && g.duel.phase !== 'tilbud';

/** Toppen av stigen / mannen på toppen, i verden. */
export const ladderTop = (l: Ladder): [number, number, number] => [slotX(l.sec, l.slot), 3.0, -0.95];
export const manPos = (l: Ladder, prog: number): [number, number, number] => [
    slotX(l.sec, l.slot),
    lerp(-2.2, 3.1, prog),
    lerp(-3.4, -0.5, prog),
];

/** Framdrift for spillets avslutning, 0-1. */
export const progress = (g: G) => clamp(g.t / g.stormAt, 0, 1);

export function pressure(g: G) {
    const w = wind(g);
    let threat = 0;
    for (const l of g.ladders) if (l.state === 'står' && l.men.length) threat += l.men[0];
    return clamp(0.12 + 0.5 * w + 0.12 * Math.min(3, threat) / 3 + 0.2 * (g.land / LAND_MAX), 0, 1);
}

function addFx(g: G, kind: Fx['kind'], p: [number, number, number], max = 0.8) {
    if (g.fx.length > 80) g.fx.shift();
    g.fx.push({ kind, x: p[0], y: p[1], z: p[2], life: max, max });
}

function breakCombo(g: G) {
    g.combo = 0;
}

function hurt(g: G, dmg: number, io: IO) {
    g.hp -= dmg;
    g.shake = Math.max(g.shake, 0.5);
    g.flash = 0.35;
    breakCombo(g);
    io.sfx.hurt();
    if (g.hp <= 0 && !g.ended) {
        g.hp = 0;
        g.cause = 'fall';
        g.ended = 'tapt';
        io.lose('fall');
    }
}

function manOver(g: G, l: Ladder, io: IO) {
    g.land += 1;
    breakCombo(g);
    addFx(g, 'over', [slotX(l.sec, l.slot), 3.2, 0.6], 1);
    io.sfx.over();
    if (!g.done.has('iland')) {
        g.done.add('iland');
        io.beat(
            'iland',
            'I land',
            'En mongol kom seg over muren. I land er han trygg for stormen - skyv stigene før de når toppen.',
            () => [slotX(l.sec, l.slot), 3.4, 0.4]
        );
        io.lesson(
            'muren',
            'Etter 1274 bygde japanerne en steinmur langs Hakata-bukta. I 1281 kom ikke mongolene i land - hele flåten ble liggende i bukta.',
            2
        );
    }
    if (g.land >= LAND_MAX && !g.ended) {
        g.cause = 'land';
        g.ended = 'tapt';
        io.lose('land');
    }
}

// ---------------------------------------------------------------------------
// Grepene (samme for eleven og robotene)
// ---------------------------------------------------------------------------

/** Hold inne A/D: -1, 0 eller 1. */
export function setWalk(g: G, dir: number) {
    g.walk = dir;
    if (dir) g.goalX = null;
}

/** Gå til et punkt langs muren (robotene, og trykk på kantknappene). */
export function goToX(g: G, x: number) {
    if (g.ended || g.storm >= 0 || inDuel(g)) return;
    g.goalX = clamp(x, WALK_MIN, WALK_MAX);
}

export function setShield(g: G, on: boolean) {
    g.shield = on;
}

/** Ett sveip. `targets` er det sveipet krysset (komponenten regner det ut på skjermen). */
export function swipe(g: G, targets: Target[], io: IO, gesture: Gesture = 'begge'): number {
    if (g.ended || g.swingCd > 0 || g.shield) return 0;
    g.swingCd = SWING_CD;
    g.swingAt = g.t;
    g.swingKind = gesture;
    io.sfx.swing();
    let hits = 0;
    for (const tg of targets) {
        if (tg.kind === 'kjempe') {
            if (hitChamp(g, io)) hits++;
            continue;
        }
        if (inDuel(g)) continue;
        if (tg.kind === 'bombe') {
            const b = g.bombs.find((x) => x.id === tg.id);
            if (!b || b.state === 'slått' || !inReach(g, slotX(b.sec, b.slot))) continue;
            b.state = 'slått';
            b.t = 0.6;
            g.deflects += 1;
            g.score += BOMB_PTS * comboMult(g.combo);
            io.sfx.deflect();
            io.float(`+${BOMB_PTS * comboMult(g.combo)}`, [slotX(b.sec, b.slot), 3.2, -0.5], '#c9a24a');
            g.unlocked.add('tetsuhau');
            hits++;
            continue;
        }
        const l = g.ladders.find((x) => x.id === tg.id);
        if (!l || !inReach(g, slotX(l.sec, l.slot)) || l.state === 'faller') continue;
        const gs = tg.gesture ?? gesture;
        if (l.top >= 0) {
            if (gs === 'skyv') continue;
            // Mannen på muren: hugg. Han er borte for godt.
            l.men.shift();
            l.top = -1;
            l.hitT = MAN_HIT_EVERY;
            g.kills += 1;
            g.combo += 1;
            g.bestCombo = Math.max(g.bestCombo, g.combo);
            const pts = KILL_PTS * comboMult(g.combo);
            g.score += pts;
            g.freeze = 0.1;
            g.swingKind = 'hugg';
            g.shake = Math.max(g.shake, 0.25);
            addFx(g, 'gnist', ladderTop(l), 0.5);
            addFx(g, 'mann', ladderTop(l), 1.1);
            io.sfx.kill(g.combo);
            io.float(`+${pts}`, ladderTop(l), '#ffd76a', g.combo >= 4);
            hits++;
        } else if (l.state === 'står' || l.raise > 0.6) {
            if (gs === 'hugg') continue;
            // Ingen på toppen: skyv stigen bakover. Alle på den havner i sjøen - og
            // svømmer tilbake til båtene etter en stund.
            const n = l.men.length;
            l.state = 'faller';
            l.fallT = 0;
            for (let k = 0; k < n; k++) g.swim.push(SWIM_MIN + g.rng() * SWIM_VAR);
            g.dunked += n;
            g.pushes += 1;
            g.swingKind = 'skyv';
            g.freeze = 0.05;
            g.shake = Math.max(g.shake, 0.15 + 0.05 * n);
            io.sfx.push();
            if (n > 0)
                io.float(n === 1 ? '1 i sjøen' : `${n} i sjøen`, ladderTop(l), '#ffffff', n >= 3);
            if (!g.done.has('forstepush') && n > 0) {
                g.done.add('forstepush');
                io.pin('sjoen', 'I sjøen - til de svømmer tilbake', () => [slotX(l.sec, l.slot), 0, -3.6], {
                    tone: 'bra',
                    seconds: 3.5,
                });
            }
            hits++;
        }
    }
    return hits;
}

/** Ta imot utfordringen: hopp ned fra muren og møt kjempen én mot én. */
export function challenge(g: G, io: IO) {
    const d = g.duel;
    if (!d || d.phase !== 'tilbud' || g.ended || Math.abs(d.x - g.px) > 3) return false;
    d.phase = 'kamp';
    d.t = 0;
    d.champ = 'vakt';
    d.champT = 0.9;
    d.flockT = 2.4;
    g.duelsTaken += 1;
    g.shield = false;
    io.sfx.drum();
    io.banner('TVEKAMP', '#c0392b');
    g.unlocked.add('tvekampen');
    return true;
}

function hitChamp(g: G, io: IO) {
    const d = g.duel;
    if (!d || d.phase !== 'kamp') return false;
    if (d.champ !== 'åpen') {
        io.sfx.deflect();
        return false;
    }
    d.champHp -= 1;
    d.champ = 'vakt';
    d.champT = 0.7;
    g.freeze = 0.09;
    g.shake = Math.max(g.shake, 0.3);
    addFx(g, 'gnist', [d.x, 1.2, -2.2], 0.5);
    io.sfx.kill(g.combo + 1);
    if (d.champHp <= 0) {
        const pts = DUEL_PTS * comboMult(g.combo);
        g.score += pts;
        g.duelsWon += 1;
        d.won = true;
        d.phase = 'tilbake';
        d.t = 1.1;
        io.float(`+${pts} ÆRE`, [d.x, 1.8, -2.2], '#ffd76a', true);
    }
    return true;
}

// ---------------------------------------------------------------------------
// Tidssteget
// ---------------------------------------------------------------------------

function spawnLadder(g: G, io: IO) {
    const w = wind(g);
    const rng = g.rng;
    // Mongolene går oftest mot murdelen eleven IKKE står på - og mot en tom plass.
    const free: [number, number][] = [];
    for (let s = 0; s < SECTIONS; s++)
        for (let k = 0; k < SLOTS; k++)
            if (!g.ladders.some((l) => l.sec === s && l.slot === k)) free.push([s, k]);
    if (!free.length) return;
    const [sec, slot] = free[Math.floor(rng() * free.length)];
    const men = 1 + Math.floor(rng() * (1.6 + 3.2 * w));
    g.ladders.push({
        id: g.nextId++,
        sec,
        slot,
        state: 'reises',
        raise: 0,
        fallT: 0,
        men: [0.18],
        top: -1,
        hitT: MAN_HIT_EVERY,
        queue: men - 1,
        queueT: 0.7,
        climbS: lerp(3.8, 1.8, w) * (0.9 + rng() * 0.2),
    });
    g.valg += 1;
    io.sfx.thud();
}

export function update(g: G, dt: number, io: IO) {
    if (g.ended) return;
    if (g.freeze > 0) {
        g.freeze -= dt;
        return;
    }
    g.t += dt;
    const w = wind(g);
    g.swingCd = Math.max(0, g.swingCd - dt);
    // Gange langs muren.
    if (onWall(g) && g.storm < 0) {
        let dir = g.walk;
        if (!dir && g.goalX !== null) {
            const d = g.goalX - g.px;
            if (Math.abs(d) < 0.08) g.goalX = null;
            else dir = Math.sign(d) * Math.min(1, Math.abs(d) / 0.4);
        }
        g.px = clamp(g.px + dir * WALK_SPEED * dt, WALK_MIN, WALK_MAX);
    }
    g.sec = nearestSec(g.px);
    if (g.hp < HP_MAX) g.hp = Math.min(HP_MAX, g.hp + 1.6 * dt);
    if (g.storm < 0 && g.swim.length) {
        for (let i = 0; i < g.swim.length; i++) g.swim[i] -= dt;
        g.swim = g.swim.filter((x) => x > 0);
    }

    // --- Tyfonen ---
    if (g.storm < 0 && g.t >= g.stormAt) {
        g.storm = 0;
        g.duel = null;
        g.shield = false;
        g.volleys = [];
        g.bombs = [];
        // Alle som fortsatt klatrer, blåses av stigene og i sjøen.
        g.sea = g.swim.length;
        for (const l of g.ladders) {
            if (l.state !== 'faller') {
                g.sea += l.men.length + l.queue;
                l.queue = 0;
                l.state = 'faller';
                l.fallT = 0;
            }
        }
        g.seaBonus = g.sea * SEA_PTS;
        io.sfx.thunder();
        io.banner('KAMIKAZE', '#eadfc4');
        g.unlocked.add('tyfonen');
        io.beat(
            'kamikaze',
            'Den guddommelige vinden',
            'En tyfon knuser flåten som ligger i bukta. Alle som var i sjøen og på stigene, er borte. Japanerne kalte stormen kamikaze.'
        );
        io.lesson(
            'storm',
            `Tyfonen tok flåten fordi den lå i bukta. ${g.sea} mongoler var i sjøen da den slo til - bare de ${g.land} i land overlevde stormen.`,
            3
        );
    }
    if (g.storm >= 0) {
        g.storm += dt;
        // Poengene tikker inn mens skipene synker.
        const k = clamp(g.storm / (STORM_LEN - 1.5), 0, 1);
        const target = Math.floor(g.seaBonus * k);
        const paid = Math.floor(g.seaBonus * clamp((g.storm - dt) / (STORM_LEN - 1.5), 0, 1));
        g.score += target - paid;
        stepLadders(g, dt, io, w);
        if (g.storm >= STORM_LEN && !g.ended) {
            g.ended = 'vunnet';
            io.win();
        }
        return;
    }

    // --- Nye stiger: tettere jo sterkere vinden er (mongolene blir desperate) ---
    g.ladderT -= dt;
    if (g.ladderT <= 0) {
        spawnLadder(g, io);
        // Sent i runden kommer de i bølger: to stiger på en gang.
        if (g.rng() < w * 0.45) spawnLadder(g, io);
        g.ladderT = lerp(2.8, 0.95, Math.pow(w, 0.9)) * (0.8 + g.rng() * 0.4);
    }

    stepLadders(g, dt, io, w);

    // --- Pilregn mot murdelen der eleven står ---
    g.volleyT -= dt;
    if (g.volleyT <= 0) {
        const sec = inDuel(g) ? g.duel!.sec : g.sec;
        const vx = inDuel(g) ? g.duel!.x : g.px;
        const max = 2.3;
        g.volleys.push({ id: g.nextId++, sec, x: vx, t: max, max, drift: g.rng() < w * 0.35 });
        g.volleyT = lerp(10, 4.6, w) * (0.8 + g.rng() * 0.4);
        g.valg += 1;
        io.sfx.bows();
        if (!g.done.has('piler')) {
            g.done.add('piler');
            io.pin('piler', 'Buene spennes - hold mellomrom', () => [vx, 5, -14], {
                tone: 'fare',
                seconds: 3,
                until: () => g.shield,
            });
        }
    }
    for (const v of g.volleys) {
        v.t -= dt;
        if (v.t <= 0) {
            const here = Math.abs((inDuel(g) ? g.duel!.x : g.px) - v.x) < 2.8;
            addFx(g, 'pil', [v.x, 3, 0], 0.6);
            if (v.drift) {
                io.float('Vinden tok pilene', [v.x, 4.2, -2], '#ffffff');
                g.unlocked.add('vinden');
            } else if (here) {
                io.sfx.arrows(g.shield);
                if (!g.shield) hurt(g, ARROW_DMG, io);
                else g.score += 5;
            } else io.sfx.arrows(true);
        }
    }
    g.volleys = g.volleys.filter((v) => v.t > 0);

    // --- Kruttbomber (tetsuhau) ---
    if (g.t > 24) {
        g.bombT -= dt;
        if (g.bombT <= 0) {
            // Kastet mot der eleven står (oftest), ellers et tilfeldig sted på muren.
            let sec = Math.floor(g.rng() * SECTIONS);
            let slot = Math.floor(g.rng() * SLOTS);
            if (g.rng() < 0.7) {
                sec = g.sec;
                let bd = 99;
                for (let k = 0; k < SLOTS; k++) {
                    const d = Math.abs(slotX(sec, k) - g.px) + g.rng() * 0.8;
                    if (d < bd) {
                        bd = d;
                        slot = k;
                    }
                }
            }
            g.bombs.push({ id: g.nextId++, sec, slot, t: 2.3, max: 2.3, state: 'lufta' });
            g.bombT = lerp(13, 5.5, w) * (0.8 + g.rng() * 0.4);
            g.valg += 1;
            io.sfx.fuse();
            if (!g.done.has('bombe')) {
                g.done.add('bombe');
                io.lesson(
                    'tetsuhau',
                    'Mongolene kastet kruttbomber, tetsuhau - noe samuraiene aldri hadde sett før 1274.'
                );
            }
        }
    }
    for (const b of g.bombs) {
        b.t -= dt;
        if (b.state === 'lufta' && b.t < b.max - 0.7) b.state = 'ligger';
        if (b.t <= 0 && b.state !== 'slått') {
            addFx(g, 'smell', [slotX(b.sec, b.slot), 3.2, -0.3], 0.7);
            io.sfx.boom();
            const here = !inDuel(g) && Math.abs(slotX(b.sec, b.slot) - g.px) < 2.2;
            if (here) hurt(g, g.shield ? 6 : BOMB_DMG, io);
            // Smellet river stigen i samme plass over ende - og mannen på toppen tar sjansen.
        } else if (b.t <= 0 && b.state === 'slått') {
            addFx(g, 'plask', [slotX(b.sec, b.slot), -2.4, -5], 0.8);
        }
    }
    g.bombs = g.bombs.filter((b) => b.t > 0);

    // --- Tvekampen ---
    stepDuel(g, dt, io);
}

function stepLadders(g: G, dt: number, io: IO, w: number) {
    for (const l of g.ladders) {
        if (l.state === 'faller') {
            l.fallT += dt;
            if (l.fallT > 0.45 && l.fallT - dt <= 0.45) {
                addFx(g, 'plask', [slotX(l.sec, l.slot), -2.4, -4.6], 0.9);
                io.sfx.splash();
            }
            continue;
        }
        if (l.state === 'reises') {
            l.raise += dt / 0.55;
            if (l.raise >= 1) {
                l.raise = 1;
                l.state = 'står';
            }
        }
        // Nye klatrere på stigen.
        if (l.queue > 0) {
            l.queueT -= dt;
            const last = l.men[l.men.length - 1] ?? 1;
            if (l.queueT <= 0 && last > 0.22) {
                l.men.push(0);
                l.queue -= 1;
                l.queueT = 0.55;
            }
        }
        const guarded = inReach(g, slotX(l.sec, l.slot));
        // Klatring: ingen passerer mannen over seg.
        for (let i = 0; i < l.men.length; i++) {
            const cap = i === 0 ? 1 : l.men[i - 1] - 0.14;
            l.men[i] = Math.min(cap, l.men[i] + dt / l.climbS);
        }
        if (l.top < 0 && l.men.length && l.men[0] >= 1) {
            l.top = 0;
            l.hitT = MAN_HIT_EVERY * 0.8;
            // Mannen bak ham tar sjansen og hopper over mens han holder stigen.
            if (l.men.length > 1 && l.men[1] >= BEHIND_JUMP) {
                l.men.splice(1, 1);
                manOver(g, l, io);
            }
            if (!g.done.has('topp') && guarded) {
                g.done.add('topp');
                io.pin('topp', 'Sveip over ham - hugg!', () => ladderTop(l), {
                    tone: 'fare',
                    seconds: 2.5,
                    until: () => l.top < 0,
                });
            }
        }
        if (l.top >= 0) {
            l.top += dt;
            if (guarded) {
                // Han slåss mot deg; mennene under venter.
                l.hitT -= dt;
                if (l.hitT <= 0) {
                    l.hitT = MAN_HIT_EVERY;
                    if (!g.shield) hurt(g, MAN_DMG, io);
                    else io.sfx.deflect();
                }
                // Mens han står, kommer én til over hvert andre sekund.
                if (l.top > 2 && l.men.length > 1 && l.men[1] >= 0.85) {
                    l.men.splice(1, 1);
                    l.top = 0.001;
                    manOver(g, l, io);
                }
            } else if (l.top >= HOLD_S) {
                // Ingen på muren her: han går over, og neste mann tar toppen.
                l.men.shift();
                l.top = l.men.length && l.men[0] >= 0.95 ? 0.001 : -1;
                manOver(g, l, io);
                if (g.ended) return;
            }
        }
        // Tom stige som ikke har flere igjen: mongolene trekker den tilbake.
        if (l.men.length === 0 && l.queue === 0 && l.state === 'står') {
            l.state = 'faller';
            l.fallT = 0.3;
        }
    }
    g.ladders = g.ladders.filter((l) => !(l.state === 'faller' && l.fallT > 1.3));
    void w;
}

function stepDuel(g: G, dt: number, io: IO) {
    // Tilbud: en fanebærer stiller seg under muren der eleven står.
    if (!g.duel && g.duelOffers.length && g.t >= g.duelOffers[0]) {
        g.duelOffers.shift();
        g.duel = {
            phase: 'tilbud',
            sec: g.sec,
            x: g.px,
            t: 7,
            champHp: 3,
            champ: 'vakt',
            champT: 0,
            flockT: 0,
            won: false,
        };
        g.valg += 1;
        io.sfx.drum();
        const cx = g.px;
        io.beat(
            'tvekamp',
            'Tvekamp?',
            'En mongolsk kjempe utfordrer deg. I 1274 kjempet samuraiene én mot én. Mongolene svarte i flokk.',
            () => [cx, 0.6, -3.2],
            () => !g.duel || g.duel.phase !== 'tilbud'
        );
    }
    const d = g.duel;
    if (!d) return;
    if (d.phase === 'tilbud') {
        d.t -= dt;
        if (d.t <= 0 || Math.abs(g.px - d.x) > 4) g.duel = null;
        return;
    }
    if (d.phase === 'tilbake') {
        d.t -= dt;
        if (d.t <= 0) {
            g.duel = null;
            if (d.won)
                io.lesson(
                    'tvekamp',
                    `Du vant ${g.duelsWon === 1 ? 'en tvekamp' : `${g.duelsWon} tvekamper`} - men mens du var nede, sto muren tom. I 1274 lærte samuraiene at mongolene ikke kjempet én mot én.`,
                    2
                );
        }
        return;
    }
    // Kamp: kjempen løfter sverdet (varslet), hugger, og står åpen en liten stund.
    d.t += dt;
    d.champT -= dt;
    if (d.champT <= 0) {
        if (d.champ === 'vakt') {
            d.champ = 'løfter';
            d.champT = 0.75;
        } else if (d.champ === 'løfter') {
            if (!g.shield) hurt(g, 14, io);
            else io.sfx.deflect();
            d.champ = 'åpen';
            d.champT = 0.8;
        } else {
            d.champ = 'vakt';
            d.champT = 0.5;
        }
    }
    // Flokken kommer: trommer, piler og kruttbomber mot den som står alene på stranda.
    d.flockT -= dt;
    if (d.flockT <= 0) {
        d.flockT = 0.9;
        io.sfx.boom();
        addFx(g, 'smell', [d.x + (g.rng() - 0.5) * 4, 0.4, -1.6], 0.7);
        if (!g.shield) hurt(g, 9, io);
        if (!g.done.has('flokken')) {
            g.done.add('flokken');
            io.lesson(
                'flokk',
                'Samuraiene ropte navnet sitt og ventet på én motstander. Mongolene kom i flokk, med trommer, piler og bomber.',
                2
            );
        }
    }
    // Går ikke kampen, trekker eleven seg etter en stund uansett.
    if (d.t > 9) {
        d.phase = 'tilbake';
        d.t = 1.1;
    }
}

/** Trekk seg ut av tvekampen og klatre opp på muren igjen. */
export function retreat(g: G) {
    const d = g.duel;
    if (!d || d.phase !== 'kamp') return;
    d.phase = 'tilbake';
    d.t = 1.1;
}

/** Effekter som skal leve videre også når spillet er over (plask, smell). */
export function stepFx(g: G, dt: number) {
    for (const f of g.fx) f.life -= dt;
    g.fx = g.fx.filter((f) => f.life > 0);
    g.shake = Math.max(0, g.shake - dt * 1.8);
    g.flash = Math.max(0, g.flash - dt);
}

/** Sluttpoeng: seier gir bonus for mur som holdt (få i land). */
export function finalScore(g: G) {
    const won = g.ended === 'vunnet';
    return Math.floor(g.score + (won ? 2500 + (LAND_MAX - g.land) * 80 : 0));
}
