// Spillreglene i Petisjonen. Ren TypeScript uten React og three, så selvspillet kan
// kjøre hundrevis av runder med npx tsx.
//
// Du er petisjonen til kongen, en papirrull som ruller gjennom Østlandet fra
// desember 1848 til mai 1850. Fagkjernen er regelen fra artikkelen: alene får
// du ett navn om gangen. Samler du folk fra én bygd og holder møte i låven,
// starter de sin egen forening med egen leder. Foreningen verver videre av seg
// selv og samler navn til deg - og fra mai 1849, da avisa kom, verver store
// foreninger også nabobygda. De med stemmerett (gårdeiere og embetsmenn) vil
// ikke ha forandring: de jager rullen og river av navn.

import {
    PLACES,
    SOLIDS,
    SLOTTET,
    SLOTTET_R,
    HUNTER_HOME,
    HALF_W,
    HALF_D,
    START_PLACE,
    dist,
    type XZ,
} from './geo';

export const RUN_SECONDS = 170;
export const GOAL = 13000;
export const MONTH_SECONDS = 10;
/** Sekunder rullen må stå på tunet før møtet er holdt. */
export const MEET_TIME = 1.3;
/** Avisa (Arbeider-Foreningernes Blad) kommer i mai 1849. */
export const AVISA_AT = 5 * MONTH_SECONDS;
/** Når embetsmenn og lensmenn rir ut fra Christiania. */
export const HUNTER_TIMES = [24, 48, 72, 94, 112, 128, 144];
/** Hvor mange navnelapper som kan være i lufta samtidig (resten legges rett på). */
const MAX_SLIPS = 90;
/** Figurer som vises festet på rullen. */
export const MAX_STUCK = 34;
/** Foreningene kan bli større enn tallene i geo.ts (samlet rundt 30 000 medlemmer). */
const CAP_SCALE = 1.7;

export type Mode = 'menu' | 'play' | 'paused' | 'dying' | 'over';
export type Cause = 'kort' | 'revet';
export type At = () => XZ | null;

export interface Sfx {
    pick: (size: number) => void;
    ready: () => void;
    meeting: (k: number) => void;
    found: () => void;
    slip: (k: number) => void;
    tear: () => void;
    hunter: () => void;
    grow: (level: number) => void;
    recruit: () => void;
    open: () => void;
    month: () => void;
}

export interface IO {
    sfx: Sfx;
    banner: (t: string, color?: string) => void;
    pin: (
        key: string,
        text: string,
        at: At,
        o?: { seconds?: number; until?: () => boolean; tone?: 'info' | 'fare' | 'bra' }
    ) => void;
    beat: (key: string, title: string, text: string, at?: At, until?: () => boolean) => void;
    lesson: (key: string, text: string, w?: number) => void;
    timeScale: () => number;
    float: (text: string, x: number, z: number, color?: string, big?: boolean) => void;
    lose: (cause: Cause) => void;
    win: () => void;
}

export type PersonState = 'står' | 'borte' | 'medlem';
export interface Person {
    place: number;
    spot: number;
    p: XZ;
    state: PersonState;
    /** Sekunder til en ny husmann står der igjen. */
    back: number;
    /** 0-1: popper opp når den kommer tilbake. */
    pop: number;
    face: number;
}

export interface Hunter {
    kind: 'bonde' | 'embetsmann';
    place: number;
    p: XZ;
    v: XZ;
    home: XZ;
    active: boolean;
    /** Sekunder han står og river i papiret etter et treff. */
    stun: number;
    /** Tilfeldig patruljemål. */
    goal: XZ;
    chasing: boolean;
    /** 0-1 når han rir ut (for animasjon). */
    born: number;
}

export interface Forening {
    members: number;
    /** Medlemmer som allerede har skrevet under. */
    signed: number;
    /** Navn som ligger klare i låven. */
    pile: number;
    byYou: boolean;
    founded: number;
    /** Bygda den verver nå, og hvor langt den har kommet (0-1). */
    recruit: number;
    recruitProg: number;
    /** Sekunder siden forrige navnelapp ble sendt. */
    slipClock: number;
    harvesting: boolean;
    fullNoted: boolean;
}

export interface PlaceState {
    spark: number;
    klar: boolean;
    meeting: number;
    forening: Forening | null;
    /** For en kort blink når noe skjer i bygda. */
    flash: number;
}

export interface Slip {
    from: XZ;
    t: number;
    dur: number;
    names: number;
    arc: number;
    place: number;
}

export interface Scrap {
    p: [number, number, number];
    v: [number, number, number];
    life: number;
    spin: number;
}

export interface Stuck {
    /** Vinkel rundt rullen og posisjon langs aksen (-1..1). */
    ang: number;
    along: number;
    wob: number;
    kind: number;
}

export interface Roll {
    p: XZ;
    v: XZ;
    r: number;
    names: number;
    spin: number;
    heading: number;
    invuln: number;
    /** Lagt til for juice: rullen «sveller» litt når den får navn. */
    bump: number;
}

export interface G {
    t: number;
    roll: Roll;
    target: XZ | null;
    keys: XZ;
    people: Person[];
    hunters: Hunter[];
    places: PlaceState[];
    slips: Slip[];
    scraps: Scrap[];
    stuck: Stuck[];
    score: number;
    valg: number;
    press: number;
    level: number;
    month: number;
    avisa: boolean;
    open: boolean;
    delivered: boolean;
    cause: Cause | null;
    shake: number;
    torn: number;
    hits: number;
    singles: number;
    foundedByYou: number;
    recruited: number;
    harvested: number;
    comboBest: number;
    combo: number;
    comboBonus: number;
    nextHunter: number;
    meetingPlace: number;
    done: Set<string>;
    /** Stedene du har startet forening i denne runden (til protokollen). */
    protokoll: string[];
    rand: () => number;
}

// ---------------------------------------------------------------------------

export const MONTHS = [
    'desember',
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
    'januar',
    'februar',
    'mars',
    'april',
    'mai',
];

export function dateOf(t: number) {
    const i = Math.min(MONTHS.length - 1, Math.floor(t / MONTH_SECONDS));
    const y = i === 0 ? 1848 : i <= 12 ? 1849 : 1850;
    return { m: MONTHS[i], y, i };
}

export function rollRadius(names: number) {
    return 0.42 + 0.085 * Math.cbrt(Math.max(0, names));
}

export function rollSpeed(r: number) {
    return 6.2 + 1.25 * r;
}

export function hunterSpeed(t: number) {
    return 3.9 + 0.011 * t;
}

/** Hvor langt navnene når fra en forening: større forening, lengre elv. */
export function reach(f: Forening, r: number) {
    return 3.2 + r + Math.min(9, f.members / 170);
}

/** Rangene går på antall navn. De ekte thranittene fikk 13 000 navn og 30 000 medlemmer. */
export const RANKS: [number, string][] = [
    [0, 'Lapp'],
    [3000, 'Liste'],
    [8000, 'Bønneskrift'],
    [13000, 'Petisjon'],
    [18000, 'Folkekrav'],
    [24000, 'Folkebevegelse'],
    [30000, 'Thranitt'],
];

export function newGame(rand: () => number = Math.random): G {
    const places: PlaceState[] = PLACES.map(() => ({
        spark: 0,
        klar: false,
        meeting: 0,
        forening: null,
        flash: 0,
    }));
    const people: Person[] = [];
    PLACES.forEach((pl, i) => {
        const n = Math.min(pl.folk, pl.spots.length);
        for (let k = 0; k < n; k++)
            people.push({
                place: i,
                spot: k,
                p: [...pl.spots[k]] as XZ,
                state: 'står',
                back: 0,
                pop: 1,
                face: rand() * Math.PI * 2,
            });
    });
    const hunters: Hunter[] = PLACES.map((pl, i) => ({
        kind: 'bonde' as const,
        place: i,
        p: [...pl.gard] as XZ,
        v: [0, 0] as XZ,
        home: [...pl.gard] as XZ,
        active: true,
        stun: 0,
        goal: [...pl.gard] as XZ,
        chasing: false,
        born: 1,
    }));
    for (let k = 0; k < HUNTER_TIMES.length; k++)
        hunters.push({
            kind: 'embetsmann',
            place: -1,
            p: [...HUNTER_HOME] as XZ,
            v: [0, 0],
            home: [...HUNTER_HOME] as XZ,
            active: false,
            stun: 0,
            goal: [...HUNTER_HOME] as XZ,
            chasing: false,
            born: 0,
        });
    const start = PLACES[START_PLACE];
    return {
        t: 0,
        roll: {
            p: [start.tun[0] - 5, start.tun[1] + 4],
            v: [0, 0],
            r: rollRadius(0),
            names: 0,
            spin: 0,
            heading: 0,
            invuln: 0,
            bump: 0,
        },
        target: null,
        keys: [0, 0],
        people,
        hunters,
        places,
        slips: [],
        scraps: [],
        stuck: [],
        score: 0,
        valg: 0,
        press: 0,
        level: 0,
        month: 0,
        avisa: false,
        open: false,
        delivered: false,
        cause: null,
        shake: 0,
        torn: 0,
        hits: 0,
        singles: 0,
        foundedByYou: 0,
        recruited: 0,
        harvested: 0,
        comboBest: 1,
        combo: 1,
        comboBonus: 0,
        nextHunter: 0,
        meetingPlace: -1,
        done: new Set(),
        protokoll: [],
        rand,
    };
}

/** Styr rullen mot et punkt på kartet (pekeren, eller roboten). null = slipp. */
export function setTarget(g: G, p: XZ | null) {
    g.target = p;
}

export function setKeys(g: G, x: number, z: number) {
    g.keys = [x, z];
}

export function foreningCount(g: G) {
    return g.places.filter((p) => p.forening).length;
}

export function members(g: G) {
    let n = 0;
    for (const p of g.places) if (p.forening) n += p.forening.members;
    return Math.round(n);
}

/** Møteklar bygd nærmest et punkt, eller -1. */
export function readyPlaces(g: G) {
    const out: number[] = [];
    g.places.forEach((p, i) => {
        if (p.klar && !p.forening) out.push(i);
    });
    return out;
}

const once = (g: G, key: string) => {
    if (g.done.has(key)) return false;
    g.done.add(key);
    return true;
};

function found(g: G, i: number, byYou: boolean, io: IO) {
    const ps = g.places[i];
    const pl = PLACES[i];
    ps.forening = {
        members: byYou ? 30 + ps.spark * 6 : 20,
        signed: 0,
        pile: 0,
        byYou,
        founded: g.t,
        recruit: -1,
        recruitProg: 0,
        slipClock: 0,
        harvesting: false,
        fullNoted: false,
    };
    ps.spark = 0;
    ps.klar = false;
    ps.meeting = 0;
    ps.flash = 1;
    for (const p of g.people)
        if (p.place === i) {
            p.state = 'medlem';
            p.pop = 0;
        }
    g.valg++;
    if (byYou) {
        g.foundedByYou++;
        g.score += 250;
        if (!g.protokoll.includes(pl.id)) g.protokoll.push(pl.id);
        io.sfx.found();
        io.banner(`${pl.name.toUpperCase()} ARBEIDERFORENING`, '#b3261e');
        io.lesson(
            'forening',
            'Folk startet egne foreninger og valgte sine egne ledere. Da vokste bevegelsen uten at Thrane måtte være der.',
            1
        );
        if (once(g, 'beat-forening'))
            io.beat(
                'forening',
                'Egen forening',
                'Bygda har egen leder nå. Foreningen verver flere og samler navn til deg - også når du er borte.',
                () => pl.tun,
                () => g.places[i].forening!.harvesting && g.t - g.places[i].forening!.founded > 1.5
            );
        else
            io.pin(`forening-${i}`, 'Egen forening - samler navn', () => pl.tun, {
                seconds: 3,
                tone: 'bra',
            });
    } else {
        g.recruited++;
        g.score += 120;
        io.sfx.recruit();
        io.float(`${pl.name.toUpperCase()} VERVET`, pl.tun[0], pl.tun[1], '#ffd8cf');
        io.lesson(
            'avisa',
            'Arbeider-Foreningernes Blad bandt foreningene sammen. Store foreninger vervet nabobygdene uten at Thrane kom dit.',
            1
        );
    }
}

function tear(g: G, h: Hunter, io: IO) {
    const R = g.roll;
    const lost = Math.max(12, Math.round(R.names * 0.15));
    g.hits++;
    h.stun = 4;
    h.v = [0, 0];
    R.invuln = 1.4;
    const dx = R.p[0] - h.p[0];
    const dz = R.p[1] - h.p[1];
    const d = Math.hypot(dx, dz) || 1;
    R.v = [(dx / d) * 11, (dz / d) * 11];
    g.shake = 0.6;
    io.sfx.tear();
    for (let k = 0; k < 14; k++)
        g.scraps.push({
            p: [R.p[0], R.r * 1.2, R.p[1]],
            v: [(g.rand() - 0.5) * 6, 3 + g.rand() * 5, (g.rand() - 0.5) * 6],
            life: 1.4 + g.rand() * 0.8,
            spin: g.rand() * 10,
        });
    io.lesson(
        'stemmerett',
        'Embetsmenn og gårdeiere hadde stemmerett. De ville ikke dele makta med husmenn og arbeidere.',
        1
    );
    // Er det ingenting igjen å rive av, er petisjonen revet i stykker.
    if (g.t > 30 && R.names < 1) {
        io.lose('revet');
        return;
    }
    const take = Math.min(R.names, lost);
    R.names -= take;
    g.torn += take;
    io.float(`-${take} NAVN`, R.p[0], R.p[1], '#ff9d8a', true);
    // Figurer ryker også av.
    g.stuck.splice(0, Math.min(g.stuck.length, 3));
}

// ---------------------------------------------------------------------------

export function update(g: G, dt: number, io: IO) {
    if (dt <= 0) return;
    g.t += dt;
    const R = g.roll;

    // --- kalenderen ---
    const d = dateOf(g.t);
    if (d.i !== g.month) {
        g.month = d.i;
        io.sfx.month();
        if (d.i === 3) io.banner('MARS 1849');
        if (d.i === 13) io.banner('JANUAR 1850');
        if (d.i === 17) io.banner('MAI 1850', '#b3261e');
    }
    if (!g.avisa && g.t >= AVISA_AT) {
        g.avisa = true;
        g.valg++;
        io.banner('AVISA KOMMER UT', '#1c1915');
        io.lesson(
            'avisa',
            'Arbeider-Foreningernes Blad bandt foreningene sammen. Store foreninger vervet nabobygdene uten at Thrane kom dit.',
            0.5
        );
    }

    // --- styring ---
    const r = R.r;
    const vmax = rollSpeed(r);
    let dx = 0;
    let dz = 0;
    if (g.keys[0] || g.keys[1]) {
        dx = g.keys[0];
        dz = g.keys[1];
    } else if (g.target) {
        dx = g.target[0] - R.p[0];
        dz = g.target[1] - R.p[1];
    }
    const dl = Math.hypot(dx, dz);
    let want: XZ = [0, 0];
    if (dl > 0.25) {
        // Pekeren nær rullen = sakte (lett å stoppe på et tun).
        const k = g.keys[0] || g.keys[1] ? 1 : Math.min(1, dl / 2.2);
        want = [(dx / dl) * vmax * k, (dz / dl) * vmax * k];
    }
    const acc = Math.min(1, dt * 5.5);
    R.v[0] += (want[0] - R.v[0]) * acc;
    R.v[1] += (want[1] - R.v[1]) * acc;
    R.p[0] += R.v[0] * dt;
    R.p[1] += R.v[1] * dt;
    const sp = Math.hypot(R.v[0], R.v[1]);
    R.spin += (sp * dt) / Math.max(0.3, r);
    if (sp > 0.4) {
        let dh = Math.atan2(R.v[0], R.v[1]) - R.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        R.heading += dh * Math.min(1, dt * 9);
    }
    // Hus står i veien - rullen sklir rundt dem i stedet for å bli stående.
    for (const s of SOLIDS) {
        const ox = R.p[0] - s.p[0];
        const oz = R.p[1] - s.p[1];
        const od = Math.hypot(ox, oz);
        const min = s.r + r * 0.8;
        if (od < min && od > 1e-4) {
            const nx = ox / od;
            const nz = oz / od;
            R.p[0] = s.p[0] + nx * min;
            R.p[1] = s.p[1] + nz * min;
            // Farten inn i huset blir til fart rundt det.
            const into = R.v[0] * nx + R.v[1] * nz;
            if (into < 0) {
                let tx = -nz;
                let tz = nx;
                const side = want[0] * tx + want[1] * tz;
                if (side < 0 || (Math.abs(side) < 0.2 && (s.p[0] + s.p[1]) % 2 > 1)) {
                    tx = -tx;
                    tz = -tz;
                }
                R.v[0] -= into * nx;
                R.v[1] -= into * nz;
                R.v[0] += tx * -into * 0.9;
                R.v[1] += tz * -into * 0.9;
            }
        }
    }
    R.p[0] = Math.max(-HALF_W + r, Math.min(HALF_W - r, R.p[0]));
    R.p[1] = Math.max(-HALF_D + r, Math.min(HALF_D - r, R.p[1]));
    R.invuln = Math.max(0, R.invuln - dt);
    R.bump = Math.max(0, R.bump - dt * 3);
    g.shake = Math.max(0, g.shake - dt * 2);

    // --- husmenn: rull inn i dem ---
    for (const p of g.people) {
        if (p.state === 'borte') {
            p.back -= dt;
            if (p.back <= 0 && !g.places[p.place].forening) {
                p.state = 'står';
                p.pop = 0;
            }
            continue;
        }
        p.pop = Math.min(1, p.pop + dt * 3);
        if (p.state !== 'står') continue;
        if (dist(p.p, R.p) < r + 0.45) {
            p.state = 'borte';
            p.back = 16 + g.rand() * 6;
            R.names += 1;
            R.bump = 1;
            g.singles++;
            const ps = g.places[p.place];
            ps.spark++;
            ps.flash = 0.5;
            io.sfx.pick(r);
            io.float('+1 NAVN', p.p[0], p.p[1], '#1c1915');
            if (g.stuck.length < MAX_STUCK)
                g.stuck.push({
                    ang: -R.spin + (g.rand() - 0.5) * 0.6,
                    along: (g.rand() - 0.5) * 1.6,
                    wob: g.rand() * 6,
                    kind: Math.floor(g.rand() * 3),
                });
            if (once(g, 'husmann'))
                io.lesson(
                    'husmann',
                    'Husmennene hadde ingen stemme og ingen skriftlig kontrakt. Bonden kunne kaste dem ut når han ville.',
                    0.6
                );
            if (g.singles > 25)
                io.lesson(
                    'alene',
                    'Alene fikk du bare ett navn om gangen. Det var foreningene som samlet de tusenvis av navnene.',
                    0.3
                );
            if (ps.spark >= PLACES[p.place].need && !ps.klar && !ps.forening) {
                ps.klar = true;
                g.valg++;
                io.sfx.ready();
                const pl = PLACES[p.place];
                if (once(g, 'beat-mote'))
                    io.beat(
                        'mote',
                        'Hold møte i låven',
                        `${pl.need} fra ${pl.name} er med på rullen. Rull inn på tunet og hold møte - da starter de sin egen forening.`,
                        () => pl.tun,
                        () => g.places[p.place].meeting > 0.2
                    );
                else
                    io.pin(`klar-${p.place}`, 'Klar for møte', () => pl.tun, {
                        seconds: 5,
                        until: () => !g.places[p.place].klar,
                    });
            }
        }
    }

    // --- møter på tunet ---
    g.meetingPlace = -1;
    g.places.forEach((ps, i) => {
        ps.flash = Math.max(0, ps.flash - dt * 1.5);
        if (!ps.klar || ps.forening) return;
        const pl = PLACES[i];
        if (dist(R.p, pl.tun) < 1.9 + r * 0.5) {
            const before = ps.meeting;
            ps.meeting += dt;
            g.meetingPlace = i;
            if (Math.floor(before / 0.33) !== Math.floor(ps.meeting / 0.33))
                io.sfx.meeting(ps.meeting / MEET_TIME);
            if (ps.meeting >= MEET_TIME) found(g, i, true, io);
        } else ps.meeting = Math.max(0, ps.meeting - dt * 0.6);
    });

    // --- foreningene vokser, samler navn og verver ---
    const gRate = g.avisa ? 0.1 : 0.07;
    let harvestingNow = 0;
    g.places.forEach((ps, i) => {
        const f = ps.forening;
        if (!f) return;
        const cap = PLACES[i].cap * CAP_SCALE;
        f.members += gRate * f.members * (1 - f.members / cap) * dt;
        const unsigned = f.members - f.signed - f.pile;
        if (unsigned > 0) {
            const s = Math.min(unsigned, unsigned * 0.13 * dt + 2 * dt);
            f.pile += s;
        }
        if (f.pile > 280 && !f.fullNoted) {
            f.fullNoted = true;
            g.valg++;
        }
        // Verving: fra mai 1849 verver store foreninger nærmeste bygd uten forening.
        if (g.avisa && f.members >= 350) {
            if (f.recruit < 0 || g.places[f.recruit].forening) {
                f.recruit = -1;
                f.recruitProg = 0;
                let best = -1;
                let bd = 27;
                PLACES.forEach((q, j) => {
                    if (g.places[j].forening) return;
                    if (g.places.some((o) => o.forening && o.forening.recruit === j)) return;
                    const dd = dist(q.tun, PLACES[i].tun);
                    if (dd < bd) {
                        bd = dd;
                        best = j;
                    }
                });
                if (best >= 0) {
                    f.recruit = best;
                    g.valg++;
                }
            } else {
                f.recruitProg += dt / 20;
                if (f.recruitProg >= 1) {
                    const j = f.recruit;
                    f.recruit = -1;
                    f.recruitProg = 0;
                    found(g, j, false, io);
                }
            }
        }
        // Navnelapper flyr til rullen når den er nær nok.
        f.harvesting = false;
        if (f.pile >= 1 && dist(R.p, PLACES[i].tun) < reach(f, r)) {
            f.harvesting = true;
            harvestingNow++;
            f.slipClock += dt;
            const every = 0.07;
            while (f.slipClock >= every && f.pile >= 1) {
                f.slipClock -= every;
                const take = Math.min(f.pile, Math.max(2, Math.round(f.pile * 0.07)));
                f.pile -= take;
                f.signed += take;
                f.fullNoted = f.pile > 280 && f.fullNoted;
                const from = PLACES[i].tun;
                if (g.slips.length < MAX_SLIPS)
                    g.slips.push({
                        from: [from[0] + (g.rand() - 0.5) * 1.5, from[1] + (g.rand() - 0.5) * 1.5],
                        t: 0,
                        dur: 0.5 + g.rand() * 0.35,
                        names: take,
                        arc: 1.5 + g.rand() * 2.5,
                        place: i,
                    });
                else addNames(g, take);
            }
        } else f.slipClock = 0;
    });
    g.combo = Math.max(1, harvestingNow);
    g.comboBest = Math.max(g.comboBest, g.combo);
    if (harvestingNow >= 2 && once(g, 'combo'))
        io.float(`NAVN FRA ${harvestingNow} FORENINGER`, R.p[0], R.p[1], '#b3261e', true);

    // --- lappene lander på rullen ---
    for (let k = g.slips.length - 1; k >= 0; k--) {
        const s = g.slips[k];
        s.t += dt / s.dur;
        if (s.t >= 1) {
            addNames(g, s.names);
            if (g.combo > 1) {
                const bonus = Math.round(s.names * (g.combo - 1) * 0.5);
                g.comboBonus += bonus;
                g.score += bonus;
            }
            io.sfx.slip(g.combo);
            g.slips.splice(k, 1);
        }
    }

    // --- rullen vokser ---
    R.r = rollRadius(R.names);
    const lvl = R.names >= 8000 ? 4 : R.names >= 3000 ? 3 : R.names >= 800 ? 2 : R.names >= 150 ? 1 : 0;
    if (lvl > g.level) {
        g.level = lvl;
        io.sfx.grow(lvl);
    }

    // --- de med stemmerett ---
    while (g.nextHunter < HUNTER_TIMES.length && g.t >= HUNTER_TIMES[g.nextHunter]) {
        const h = g.hunters.find((x) => x.kind === 'embetsmann' && !x.active);
        g.nextHunter++;
        if (!h) break;
        h.active = true;
        h.born = 0;
        h.p = [...HUNTER_HOME];
        h.goal = [...PLACES[Math.floor(g.rand() * PLACES.length)].tun];
        g.valg++;
        io.sfx.hunter();
        if (once(g, 'beat-hatt'))
            io.beat(
                'hatt',
                'Høy svart hatt = stemmerett',
                'Embetsmenn og gårdeiere kunne stemme. De ville ikke ha forandring, og river navn av petisjonen. Sving unna!',
                () => h.p
            );
        else
            io.pin(`jeger-${g.nextHunter}`, 'Embetsmann rir ut', () => h.p, {
                seconds: 3,
                tone: 'fare',
            });
    }
    const hs = hunterSpeed(g.t);
    for (const h of g.hunters) {
        if (!h.active) continue;
        h.born = Math.min(1, h.born + dt);
        if (h.stun > 0) {
            h.stun -= dt;
            continue;
        }
        const toR = dist(h.p, R.p);
        let goal: XZ;
        let speed: number;
        if (h.kind === 'bonde') {
            const fromHome = dist(h.p, h.home);
            // Når bygda har fått forening, står folket sammen - bonden holder seg hjemme.
            const calm = !!g.places[h.place].forening;
            h.chasing = !calm && toR < 4.2 + r && fromHome < 6;
            if (h.chasing) {
                goal = R.p;
                speed = 3.8 + g.t * 0.006;
            } else {
                if (dist(h.p, h.goal) < 0.5 || dist(h.goal, h.home) > 3.2) {
                    const a = g.rand() * Math.PI * 2;
                    h.goal = [h.home[0] + Math.cos(a) * 2.5, h.home[1] + Math.sin(a) * 2.5];
                }
                goal = h.goal;
                speed = fromHome > 3.5 ? 3.2 : 1.1;
            }
        } else {
            h.chasing = toR < (h.chasing ? 12 : 9) + r * 1.5;
            if (h.chasing) goal = R.p;
            else {
                if (dist(h.p, h.goal) < 1.5)
                    h.goal = [...PLACES[Math.floor(g.rand() * PLACES.length)].tun];
                goal = h.goal;
            }
            speed = h.chasing ? hs : hs * 0.7;
        }
        let gx = goal[0] - h.p[0];
        let gz = goal[1] - h.p[1];
        // Embetsmennene sprer seg litt, så de ikke går i én klump.
        if (h.kind === 'embetsmann')
            for (const o of g.hunters) {
                if (o === h || !o.active || o.kind !== 'embetsmann') continue;
                const ox = h.p[0] - o.p[0];
                const oz = h.p[1] - o.p[1];
                const od = Math.hypot(ox, oz);
                if (od < 3 && od > 1e-3) {
                    gx += (ox / od) * (3 - od) * 2;
                    gz += (oz / od) * (3 - od) * 2;
                }
            }
        const gl = Math.hypot(gx, gz) || 1;
        const a = Math.min(1, dt * 4);
        h.v[0] += ((gx / gl) * speed - h.v[0]) * a;
        h.v[1] += ((gz / gl) * speed - h.v[1]) * a;
        h.p[0] += h.v[0] * dt;
        h.p[1] += h.v[1] * dt;
        h.p[0] = Math.max(-HALF_W, Math.min(HALF_W, h.p[0]));
        h.p[1] = Math.max(-HALF_D, Math.min(HALF_D, h.p[1]));
        if (R.invuln <= 0 && dist(h.p, R.p) < r * 0.85 + 0.45) {
            tear(g, h, io);
            if (g.cause) return;
        }
    }

    // --- papirbiter som fyker ---
    for (let k = g.scraps.length - 1; k >= 0; k--) {
        const s = g.scraps[k];
        s.life -= dt;
        s.v[1] -= 9 * dt;
        s.p[0] += s.v[0] * dt;
        s.p[1] = Math.max(0.02, s.p[1] + s.v[1] * dt);
        s.p[2] += s.v[2] * dt;
        if (s.p[1] <= 0.02) {
            s.v[0] *= 0.8;
            s.v[2] *= 0.8;
        }
        if (s.life <= 0) g.scraps.splice(k, 1);
    }

    // --- Slottet åpner ---
    if (!g.open && R.names >= GOAL) {
        g.open = true;
        g.valg++;
        io.sfx.open();
        if (once(g, 'apnet')) io.banner('13 000 NAVN!', '#b3261e');
        io.pin('slottet', 'Lever petisjonen til kongen', () => SLOTTET, {
            seconds: 60,
            tone: 'bra',
            until: () => g.delivered || !g.open,
        });
    }
    // Rives rullen under 13 000 igjen, lukkes porten til den er lang nok.
    if (g.open && R.names < GOAL) {
        g.open = false;
        io.float('PORTEN LUKKES', SLOTTET[0], SLOTTET[1], '#ff9d8a', true);
    }
    if (g.open && dist(R.p, SLOTTET) < SLOTTET_R + r) {
        g.delivered = true;
        io.win();
        return;
    }

    // --- mai 1850 ---
    if (g.t >= RUN_SECONDS) {
        if (R.names >= GOAL) {
            g.delivered = true;
            io.win();
        } else io.lose('kort');
        return;
    }

    // --- presset: flere og raskere embetsmenn, og kalenderen som går ---
    let active = 0;
    let near = 0;
    for (const h of g.hunters)
        if (h.active && h.kind === 'embetsmann') {
            active++;
            if (dist(h.p, R.p) < 10) near++;
        }
    g.press = Math.min(
        1,
        0.08 +
            0.38 * (active / HUNTER_TIMES.length) * (hs / hunterSpeed(RUN_SECONDS)) +
            0.3 * (g.t / RUN_SECONDS) +
            0.08 * Math.min(1, near / 2) +
            0.16 * Math.max(0, 1 - R.names / GOAL) * (g.t / RUN_SECONDS)
    );
}

function addNames(g: G, n: number) {
    g.roll.names += n;
    g.harvested += n;
    g.roll.bump = Math.min(1, g.roll.bump + 0.25);
}

/** Enkle effekter som går også utenfor spill (meny, slutt-skjerm). */
export function stepFx(g: G, dt: number) {
    g.shake = Math.max(0, g.shake - dt * 2);
}

/** Poeng: navnene på rullen, pluss foreninger, elver fra flere foreninger og seier. */
export function liveScore(g: G) {
    return Math.floor(g.roll.names + g.score);
}

export function finalScore(g: G, won: boolean) {
    const left = Math.max(0, RUN_SECONDS - g.t);
    return Math.floor(liveScore(g) + (won ? 2000 + left * 25 : 0));
}

export { dist, SLOTTET, PLACES };
