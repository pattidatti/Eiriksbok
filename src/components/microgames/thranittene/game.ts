import { PLACES, PRESS_POS, dist, type XZ } from './geo';

// Spillreglene for Thranittene - ren TypeScript, ingen React. 3D-scenen leser
// tilstanden hver frame, og UI-et får beskjed gjennom IO-grensesnittet.
//
// Fagkjernen (fra artikkelen): Thrane holdt møter og ga ut avisa, men det som
// bygde bevegelsen, var at folk i hver bygd startet EGEN forening og valgte
// EGNE ledere. Derfor:
//  1. En bunt aviser holder et møte: ringen i bygda fylles litt og slukner igjen.
//     Treffer du samme bygd tre ganger raskt nok, starter folket egen forening.
//     Den verver videre uten deg, sender brev til avisa og tenner nabobygdene.
//     Strør du avisene jevnt utover, slukner hvert møte, og ingenting vokser.
//  2. Etter hvert setter myndighetene inn annonser: den som melder seg ut, skal
//     slippe politiet. En forening som ikke får svar fra avisa, mister medlemmene.

export type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'over';
export type Cause = 'navn' | 'frykt' | 'tid';

/** Desember 1848 = måned 0. Juli 1851 = måned 31. */
export const MONTH_S = 5.6;
export const START_MONTH = 11; // desember (0 = januar)
export const START_YEAR = 1848;
export const PETITION_M = 17; // mai 1850
export const NEI_M = 22; // oktober 1850: kongen og Stortinget sier nei
export const LILLE_M = 30; // juni 1851: Lilletinget
export const ARREST_M = 31; // juli 1851
export const RUN_SECONDS = (ARREST_M + 0.2) * MONTH_S;
export const PETITION_GOAL = 13000;
export const GOAL = 30000;

export const STOCK_MAX = 5;
const PRINT_S = 2.8; // sekunder per bunt før avisa kommer ut
const PRINT_S_BLAD = 2.2; // etter mai 1849
const HIT = 0.36;
const DECAY = 0.05;
const FOUND_START = 0.16; // andel av folket som melder seg inn når foreningen starter
const GROW = 0.026;
const FORENING_BOOST = 0.07;
const SPREAD_R = 1.9;
const SPREAD = 0.075;
const LETTER_S = 8.5;
const LETTER_GAIN = 0.35;
const ANNONSE_DRAIN = 0.08;
const ANNONSE_LIFE = 11;
const DISSOLVE = 0.07;
const SNAP_R = 1.05;
const FEAR_S = 28;
const ARRESTS_M = 27; // mars 1851
const ARREST_EVERY = 8;

/** Naboene til hver bygd og hvor sterkt de tenner den (regnes én gang). */
const NEAR: [number, number][][] = PLACES.map((p, i) =>
    PLACES.flatMap((o, j): [number, number][] => {
        const d = dist(p.pos, o.pos);
        return j !== i && d < SPREAD_R ? [[j, 1 - d / SPREAD_R]] : [];
    })
);

export interface Village {
    i: number;
    /** 0-1: hvor varmt møtet er. 1 = folket starter egen forening. */
    glow: number;
    forening: boolean;
    members: number;
    /** Når foreningen ble startet (for flagget som heises). */
    foundedAt: number;
    /** Sist bygda fikk en bunt. */
    hitAt: number;
    letterT: number;
    /** Aktiv annonse fra myndighetene: sekunder igjen, 0 = ingen. */
    annonse: number;
    /** Hvor mange ganger bygda har fått bunter (for statistikk og robotene). */
    hits: number;
    /** Toppen ringen nådde siden forrige treff - for «møtet slukner». */
    peak: number;
    /** Sekunder bygda er skremt etter at foreningen gikk i oppløsning: møtene biter nesten ikke. */
    fear: number;
}

export interface Bundle {
    id: number;
    from: XZ;
    to: XZ;
    target: number; // bygd, -1 = bom
    t: number;
    dur: number;
    h: number;
}

export interface Letter {
    from: XZ;
    t: number;
    dur: number;
}

export interface Fx {
    kind: 'page' | 'ink' | 'spark';
    p: [number, number, number];
    v: [number, number, number];
    life: number;
    max: number;
    rot: number;
}

export interface G {
    t: number;
    month: number;
    villages: Village[];
    bundles: Bundle[];
    letters: Letter[];
    nextId: number;
    stock: number;
    printT: number;
    score: number;
    chain: number;
    bestChain: number;
    founded: number;
    autoFounded: number;
    answered: number;
    lostToAnnonse: number;
    thrown: number;
    missed: number;
    lettersIn: number;
    peakMembers: number;
    annonseT: number;
    arrestT: number;
    arrests: number;
    petitionDone: boolean;
    /** Bevegelsen har vært oppe i 30 000 minst én gang. */
    reached: boolean;
    petitionNames: number;
    done: Set<string>;
    unlocked: Set<string>;
    fx: Fx[];
    shake: number;
    /** Pressa dunker (0-1) når en bunt kommer ut. */
    pressKick: number;
    cause: Cause;
    won: boolean;
}

export interface Sfx {
    throw: () => void;
    land: () => void;
    miss: () => void;
    found: (chain: number) => void;
    letter: () => void;
    print: () => void;
    annonse: () => void;
    answer: () => void;
    lostForening: () => void;
    refuse: () => void;
    month: () => void;
    petition: () => void;
    win: () => void;
    lose: () => void;
}

/** Et punkt på kartet som en lapp eller et lærings-øyeblikk peker på. null = ikke synlig nå. */
export type At = () => XZ | null;
export interface PinOpts {
    tone?: 'info' | 'fare' | 'bra';
    seconds?: number;
    once?: boolean;
    until?: () => boolean;
}

// Tekst går aldri i en linje under spillet. banner = to-fire ord, pin = lapp
// festet til noe på kartet, beat = lærings-øyeblikk i sakte film, lesson = det
// som står på slutt-skjermen under «Dette skjedde».
export interface IO {
    sfx: Sfx;
    banner: (t: string, color?: string) => void;
    pin: (key: string, text: string, at: At, o?: PinOpts) => void;
    beat: (key: string, title: string, text: string, at?: At, until?: () => boolean) => void;
    lesson: (key: string, text: string, weight?: number) => void;
    timeScale: () => number;
    float: (t: string, p: XZ, color?: string, big?: boolean) => void;
    lose: (c: Cause) => void;
    win: () => void;
}

const MONTHS = [
    'januar',
    'februar',
    'mars',
    'april',
    'mai',
    'juni',
    'juli',
    'august',
    'september',
    'oktober',
    'november',
    'desember',
];

export function dateOf(t: number): { m: string; y: number; label: string; month: number } {
    const month = Math.min(ARREST_M, Math.floor(t / MONTH_S));
    const abs = START_MONTH + month;
    const y = START_YEAR + Math.floor(abs / 12);
    const m = MONTHS[abs % 12];
    return { m, y, label: `${m} ${y}`, month };
}

export const chainMult = (chain: number) => Math.min(4, 1 + chain);

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function newGame(): G {
    const villages: Village[] = PLACES.map((_, i) => ({
        i,
        glow: 0,
        forening: false,
        members: 0,
        foundedAt: -99,
        hitAt: -99,
        letterT: rnd(2, LETTER_S),
        annonse: 0,
        hits: 0,
        peak: 0,
        fear: 0,
    }));
    // Desember 1848: Thrane har nettopp startet den første foreningen, i Drammen.
    const d = villages[1];
    d.forening = true;
    d.members = PLACES[1].pop * 0.1;
    d.glow = 1;
    d.foundedAt = -10;
    return {
        t: 0,
        month: 0,
        villages,
        bundles: [],
        letters: [],
        nextId: 1,
        stock: 2,
        printT: 0,
        score: 0,
        chain: 0,
        bestChain: 0,
        founded: 0,
        autoFounded: 0,
        answered: 0,
        lostToAnnonse: 0,
        thrown: 0,
        missed: 0,
        lettersIn: 0,
        peakMembers: 0,
        annonseT: 0,
        arrestT: 0,
        arrests: 0,
        petitionDone: false,
        reached: false,
        petitionNames: 0,
        done: new Set(),
        unlocked: new Set(),
        fx: [],
        shake: 0,
        pressKick: 0,
        cause: 'navn',
        won: false,
    };
}

export function totalMembers(g: G) {
    let s = 0;
    for (const v of g.villages) s += v.members;
    return s;
}
export const foreningCount = (g: G) => g.villages.filter((v) => v.forening).length;

/** Nærmeste bygd innen treffavstand fra et punkt på kartet. */
export function snapVillage(p: XZ): number {
    let best = -1;
    let bd = SNAP_R;
    for (let i = 0; i < PLACES.length; i++) {
        const d = dist(PLACES[i].pos, p);
        if (d < bd) {
            bd = d;
            best = i;
        }
    }
    return best;
}

const villageAt =
    (i: number): At =>
    () =>
        PLACES[i].pos;

/**
 * Kast en bunt aviser fra pressa. Det samme grepet brukes av eleven (klikk på
 * kartet) og av robotene. `to` er punktet det ble pekt på.
 */
export function throwBundle(g: G, to: XZ, io: IO): 'ok' | 'tom' {
    if (g.stock < 1) {
        io.sfx.refuse();
        return 'tom';
    }
    const target = snapVillage(to);
    const end: XZ = target >= 0 ? PLACES[target].pos : to;
    const d = dist(PRESS_POS, end);
    g.stock -= 1;
    g.thrown++;
    g.bundles.push({
        id: g.nextId++,
        from: PRESS_POS,
        to: end,
        target,
        t: 0,
        dur: 0.45 + d * 0.085,
        h: 0.9 + d * 0.28,
    });
    io.sfx.throw();
    return 'ok';
}

function burst(g: G, p: XZ, n: number, kind: Fx['kind'], y = 0.3, speed = 1.2) {
    for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.4 + Math.random() * 0.8);
        g.fx.push({
            kind,
            p: [p[0], y, p[1]],
            v: [Math.cos(a) * s, 1.2 + Math.random() * 1.6, Math.sin(a) * s],
            life: 0,
            max: 0.9 + Math.random() * 0.8,
            rot: Math.random() * 6,
        });
    }
    if (g.fx.length > 140) g.fx.splice(0, g.fx.length - 140);
}

function found(g: G, v: Village, io: IO, auto: boolean) {
    const p = PLACES[v.i];
    v.forening = true;
    v.glow = 1;
    v.foundedAt = g.t;
    v.members = Math.max(v.members, p.pop * FOUND_START);
    v.letterT = LETTER_S * 0.6;
    g.founded++;
    if (auto) {
        g.autoFounded++;
        g.chain++;
    } else g.chain = 0;
    g.bestChain = Math.max(g.bestChain, g.chain);
    const mult = chainMult(g.chain);
    const pts = 250 * mult;
    g.score += pts;
    g.shake = Math.max(g.shake, 0.45);
    burst(g, p.pos, 16, 'spark', 0.5, 1.6);
    io.sfx.found(mult);
    io.float(auto ? `TENT AV NABOENE +${pts}` : `EGEN FORENING +${pts}`, p.pos, '#ffd166', true);
    if (g.founded === 1)
        io.lesson(
            'egen',
            'Bygder som startet egen forening med egen leder, vervet nye medlemmer uten Thrane.',
            1
        );
    if (auto)
        io.lesson(
            'naboer',
            'Foreningene spredte seg fra bygd til bygd - snart fantes de på hele Østlandet, på Vestlandet og i Trøndelag.',
            1
        );
    if (p.region === 'vest') g.unlocked.add('vestlandet');
    if (p.region === 'nord') g.unlocked.add('trondelag');
    if (g.founded >= 1) g.unlocked.add('drammen');
    const thrownAt = g.thrown;
    if (!auto)
        io.beat(
            'egen-forening',
            'Egen forening!',
            `${p.name} har valgt sin egen leder. Nå verver foreningen nye medlemmer selv - og tenner nabobygdene.`,
            villageAt(v.i),
            () => g.thrown > thrownAt
        );
}

function land(g: G, b: Bundle, io: IO) {
    if (b.target < 0) {
        g.missed++;
        burst(g, b.to, 6, 'page', 0.15, 0.8);
        io.sfx.miss();
        io.float('BOM', b.to, '#d8cfb6');
        return;
    }
    const v = g.villages[b.target];
    const p = PLACES[b.target];
    v.hits++;
    v.hitAt = g.t;
    g.shake = Math.max(g.shake, 0.14);
    burst(g, p.pos, 12, 'page', 0.35, 1.3);
    io.sfx.land();
    if (v.annonse > 0) {
        v.annonse = 0;
        g.answered++;
        g.score += 120;
        g.unlocked.add('annonsene');
        burst(g, p.pos, 10, 'spark', 0.8, 1.4);
        io.sfx.answer();
        io.float('ANNONSEN BESVART +120', p.pos, '#ffd166', true);
        if (g.answered === 1)
            io.lesson(
                'svar',
                'Avisa svarte når myndighetene prøvde å skremme folk ut av foreningene.',
                1
            );
        return;
    }
    if (v.forening) {
        const add = Math.min(p.pop - v.members, p.pop * FORENING_BOOST);
        v.members += add;
        g.score += 20;
        if (add > 60) io.float(`+${Math.round(add)}`, p.pos, '#f7f1e3');
        return;
    }
    if (v.fear > 0) {
        v.glow = Math.min(0.95, v.glow + HIT * 0.3);
        v.peak = v.glow;
        io.float('FOLK ER REDDE', p.pos, '#ffb4a0');
        io.pin('redd', 'Skremt - vent eller prøv andre', villageAt(v.i), {
            tone: 'fare',
            seconds: 3,
            once: true,
        });
        return;
    }
    v.glow = Math.min(1.05, v.glow + HIT);
    v.peak = v.glow;
    g.score += 30;
    io.float(`MØTE ${Math.min(3, Math.round(v.glow / HIT))}/3`, p.pos, '#ffc766', true);
    if (v.glow >= 1) found(g, v, io, false);
}

// Hva som skjer hver måned: bannere, historie og Protokollen.
function monthEvent(g: G, m: number, io: IO) {
    io.sfx.month();
    if (m === 5) {
        io.banner('BLADET KOMMER UT', '#1f1b16');
        g.unlocked.add('bladet');
        io.lesson(
            'blad',
            'Arbeider-Foreningernes Blad kom hver uke fra mai 1849 - på det meste i 21 000 eksemplarer.',
            0.6
        );
    } else if (m === 16) {
        io.banner('GRUNNLOVEN TIL ALLE', '#1f1b16');
        g.unlocked.add('grunnloven');
    } else if (m === PETITION_M - 2) {
        io.banner('UNDERSKRIFTENE SAMLES', '#1f1b16');
    } else if (m === NEI_M) {
        io.banner('KONGEN SIER NEI', '#8a2a22');
        // Skuffelsen: noen gir opp i hver forening.
        g.shake = Math.max(g.shake, 0.7);
        for (const v of g.villages)
            if (v.forening) {
                v.members *= 0.88;
                burst(g, PLACES[v.i].pos, 6, 'ink', 0.5, 0.9);
            }
        io.float('NEI TIL ALLE TI KRAV', PLACES[0].pos, '#ffb4a0', true);
        g.unlocked.add('kongens-nei');
        io.lesson(
            'nei',
            'Høsten 1850 sa kongen og Stortinget nei til alle de ti kravene i petisjonen.',
            1.2
        );
    } else if (m === LILLE_M) {
        io.banner('LILLETINGET', '#1f1b16');
        g.unlocked.add('lilletinget');
    } else if (m === 12) io.banner('MYNDIGHETENE VÅKNER', '#8a2a22');
    else if (m === 25) io.banner('1851', '#1f1b16');
}

function annonseInterval(m: number) {
    if (m < 6) return Infinity;
    if (m < 11) return 12;
    if (m < PETITION_M) return 7;
    if (m < NEI_M) return 5.5;
    if (m < 26) return 4;
    return 3.2;
}

function spawnAnnonse(g: G, io: IO) {
    // Myndighetene går etter de største foreningene - og aldri to ganger samme sted.
    const cands = g.villages.filter((v) => v.forening && v.annonse <= 0);
    if (!cands.length) return;
    cands.sort((a, b) => b.members - a.members + (Math.random() - 0.5) * 900);
    const v = cands[0];
    v.annonse = ANNONSE_LIFE;
    io.sfx.annonse();
    io.pin('ann', 'Meld deg ut! - svar med avisa', villageAt(v.i), {
        once: true,
        tone: 'fare',
        seconds: 4,
        until: () => v.annonse <= 0,
    });
    io.beat(
        'annonse',
        'Annonsene',
        'Myndighetene lover at den som melder seg ut, slipper politiet. Send avisa dit, ellers går medlemmene.',
        villageAt(v.i),
        () => v.annonse <= 0
    );
}

/** Hvor mye nabo-foreningene varmer opp en bygd per sekund. Over DECAY = den tennes av seg selv. */
export function heatOf(g: G, i: number) {
    let heat = 0;
    for (const [j, w] of NEAR[i]) {
        const o = g.villages[j];
        if (o.forening) heat += SPREAD * (0.35 + 0.65 * (o.members / PLACES[j].pop)) * w;
    }
    return heat;
}
export const MEETING_DECAY = DECAY;

export function update(g: G, dt: number, io: IO) {
    g.t += dt;
    const m = Math.floor(g.t / MONTH_S);
    if (m !== g.month) {
        g.month = m;
        if (m <= ARREST_M) monthEvent(g, m, io);
    }

    // Pressa
    const printS = g.month >= 5 ? PRINT_S_BLAD : PRINT_S;
    if (g.stock < STOCK_MAX) {
        g.printT += dt / printS;
        if (g.printT >= 1) {
            g.printT -= 1;
            g.stock += 1;
            g.pressKick = 1;
            io.sfx.print();
        }
    } else g.printT = Math.min(g.printT, 0.999);

    // Buntene i lufta
    for (let k = g.bundles.length - 1; k >= 0; k--) {
        const b = g.bundles[k];
        b.t += dt;
        if (b.t >= b.dur) {
            g.bundles.splice(k, 1);
            land(g, b, io);
        }
    }

    // Brevene fra foreningene til avisa
    for (let k = g.letters.length - 1; k >= 0; k--) {
        const l = g.letters[k];
        l.t += dt;
        if (l.t >= l.dur) {
            g.letters.splice(k, 1);
            g.lettersIn++;
            g.printT += LETTER_GAIN;
            io.sfx.letter();
            if (g.lettersIn === 3)
                io.pin('brev', 'Brev fra foreningene - pressa går fortere', () => PRESS_POS, {
                    tone: 'bra',
                    seconds: 4,
                });
            if (g.lettersIn >= 12) g.unlocked.add('brev');
            if (g.lettersIn === 1)
                io.lesson(
                    'brev',
                    'Mye av avisa var brev fra arbeiderne selv. For første gang kunne en husmann si hva han mente.',
                    0.8
                );
        }
    }

    // Bygdene
    const pos = PLACES;
    for (const v of g.villages) {
        const p = pos[v.i];
        if (v.forening) {
            const fill = v.members / p.pop;
            v.members += GROW * v.members * (1 - fill) * dt;
            v.letterT -= dt;
            if (v.letterT <= 0) {
                v.letterT = LETTER_S * rnd(0.8, 1.2);
                g.letters.push({ from: p.pos, t: 0, dur: 0.6 + dist(p.pos, PRESS_POS) * 0.12 });
            }
            if (v.annonse > 0) {
                v.annonse = Math.max(0, v.annonse - dt);
                v.members -= ANNONSE_DRAIN * p.pop * dt;
                if (v.members < DISSOLVE * p.pop) {
                    // Foreningen går i oppløsning: flagget tas ned.
                    v.forening = false;
                    v.annonse = 0;
                    v.glow = 0;
                    v.fear = FEAR_S;
                    v.members = 0;
                    g.lostToAnnonse++;
                    g.chain = 0;
                    g.shake = Math.max(g.shake, 0.3);
                    burst(g, p.pos, 14, 'ink', 0.5, 1.1);
                    io.sfx.lostForening();
                    io.float(`${p.name.toUpperCase()} MELDTE SEG UT`, p.pos, '#ffb4a0', true);
                    io.lesson(
                        'frykt',
                        'Myndighetene lovet at den som meldte seg ut, skulle slippe politiet. Mange meldte seg ut.',
                        1.5
                    );
                }
            }
        } else {
            // Nabo-foreninger holder møtet varmt; ellers slukner det.
            if (v.fear > 0) v.fear = Math.max(0, v.fear - dt);
            const heat = v.fear > 0 ? 0 : heatOf(g, v.i);
            const before = v.glow;
            v.glow = clamp(v.glow + (heat - DECAY) * dt, 0, 1.05);
            v.members = v.glow * 0.1 * p.pop;
            if (v.glow >= 1) found(g, v, io, true);
            // Første gang et møte slukner uten forening: lærings-øyeblikket.
            else if (v.hits > 0 && v.peak > 0.3 && before > v.peak * 0.5 && v.glow <= v.peak * 0.5)
                io.beat(
                    'slukner',
                    'Møtet slukner',
                    'Uten egen forening glemmer folk møtet. Treff bygda igjen før ringen tømmes - tre treff, og de organiserer seg.',
                    villageAt(v.i),
                    () => v.hitAt > g.t - 0.1 || v.forening
                );
            if (!v.forening && v.glow <= 0.01 && v.peak > 0) {
                v.peak = 0;
                io.lesson(
                    'slukner',
                    'Et møte alene slukner. Det var foreningene som holdt folk sammen.',
                    0.5
                );
            }
        }
    }

    const total = totalMembers(g);
    if (total > g.peakMembers) {
        g.score += (total - g.peakMembers) * 0.5;
        g.peakMembers = total;
    }

    // 1851: politiet henter lederne i de største foreningene.
    if (g.month >= ARRESTS_M) {
        g.arrestT += dt;
        if (g.arrestT >= ARREST_EVERY) {
            g.arrestT = 0;
            const big = g.villages
                .filter((v) => v.forening)
                .sort((a, b) => b.members - a.members)[0];
            if (big) {
                const p = PLACES[big.i];
                big.members *= 0.65;
                g.arrests++;
                g.shake = Math.max(g.shake, 0.4);
                burst(g, p.pos, 10, 'ink', 0.5, 1);
                io.sfx.lostForening();
                io.float('LEDEREN ARRESTERT', p.pos, '#ffb4a0', true);
                io.lesson(
                    'arrest',
                    'Sommeren 1851 ble Thrane og mange andre ledere arrestert. Allmenn stemmerett for menn kom først i 1898.',
                    1
                );
            }
        }
    }

    // Annonsene
    const iv = annonseInterval(g.month);
    if (iv < Infinity) {
        g.annonseT += dt;
        if (g.annonseT >= iv) {
            g.annonseT = 0;
            spawnAnnonse(g, io);
            if (g.month >= 26) spawnAnnonse(g, io);
        }
    }

    // Petisjonen, mai 1850
    if (!g.petitionDone && g.month >= PETITION_M) {
        g.petitionDone = true;
        g.petitionNames = Math.round(total);
        if (total < PETITION_GOAL) {
            io.lose('navn');
            return;
        }
        g.unlocked.add('petisjonen');
        g.score += 1500;
        // Underskriftene fra hver forening reiser til Christiania.
        for (const v of g.villages)
            if (v.forening) {
                const p = PLACES[v.i];
                g.letters.push({ from: p.pos, t: 0, dur: 0.6 + dist(p.pos, PRESS_POS) * 0.12 });
                io.float(`+${Math.round(v.members)} NAVN`, p.pos, '#ffd166');
            }
        io.sfx.petition();
        io.banner('13 000 NAVN TIL KONGEN', '#b8322a');
        io.lesson(
            'petisjon',
            'I mai 1850 skrev nesten 13 000 menn under på ti krav til kongen, blant dem stemmerett for alle menn.',
            1.4
        );
    }

    // 30 000 medlemmer - men seieren avgjøres 7. juli 1851, når politiet kommer.
    if (total >= GOAL && !g.reached) {
        g.reached = true;
        g.unlocked.add('30000');
        g.score += 2000;
        io.sfx.petition();
        io.banner('30 000 THRANITTER', '#b8322a');
        io.pin('hold', 'Hold dem samlet til juli 1851', () => PRESS_POS, {
            tone: 'bra',
            seconds: 5,
        });
    }
    if (g.month >= 3 && foreningCount(g) === 0) {
        io.lose('frykt');
        return;
    }
    if (g.t >= RUN_SECONDS) {
        if (total >= GOAL) {
            g.won = true;
            io.win();
        } else io.lose('tid');
        return;
    }
}

/** Effekter som går også når spillet står (partikler, rist, pressa). */
export function stepFx(g: G, dt: number) {
    for (let k = g.fx.length - 1; k >= 0; k--) {
        const f = g.fx[k];
        f.life += dt;
        if (f.life >= f.max) {
            g.fx.splice(k, 1);
            continue;
        }
        const drag = f.kind === 'page' ? 2.2 : 1.2;
        f.v[1] -= (f.kind === 'page' ? 2.2 : 4) * dt;
        f.v[0] *= 1 - drag * dt * 0.5;
        f.v[2] *= 1 - drag * dt * 0.5;
        f.p[0] += f.v[0] * dt;
        f.p[1] = Math.max(0.12, f.p[1] + f.v[1] * dt);
        f.p[2] += f.v[2] * dt;
        f.rot += dt * 5;
    }
    g.shake = Math.max(0, g.shake - dt * 1.6);
    g.pressKick = Math.max(0, g.pressKick - dt * 3);
}

/** Posisjonen til en bunt i lufta (bue fra pressa). */
export function bundlePos(b: Bundle, out: [number, number, number]) {
    const k = Math.min(1, b.t / b.dur);
    out[0] = b.from[0] + (b.to[0] - b.from[0]) * k;
    out[2] = b.from[1] + (b.to[1] - b.from[1]) * k;
    out[1] = 0.45 + 4 * b.h * k * (1 - k);
    return out;
}

export function letterPos(l: Letter, out: [number, number, number]) {
    const k = Math.min(1, l.t / l.dur);
    out[0] = l.from[0] + (PRESS_POS[0] - l.from[0]) * k;
    out[2] = l.from[1] + (PRESS_POS[1] - l.from[1]) * k;
    out[1] = 0.5 + 4 * (0.5 + dist(l.from, PRESS_POS) * 0.08) * k * (1 - k);
    return out;
}

/** Hvor snøen ligger på kartet: 1 midt på vinteren, 0 om sommeren. */
export function snowOf(t: number) {
    const d = dateOf(t);
    const abs = (START_MONTH + d.month) % 12;
    const f = (t % MONTH_S) / MONTH_S;
    const at = (m: number) => (m === 11 || m === 0 || m === 1 ? 1 : m === 2 || m === 10 ? 0.4 : 0);
    return at(abs) + (at((abs + 1) % 12) - at(abs)) * Math.max(0, f - 0.5) * 2;
}
