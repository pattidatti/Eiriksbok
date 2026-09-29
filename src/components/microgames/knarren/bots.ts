import {
    setBailing,
    setSail,
    setSteer,
    sunVisible,
    weatherOf,
    DAY,
    MAX_HEADING,
    type Game,
} from './game';

// Selvspill-robotene for Kurs for Grønland. De styrer, rever og øser med de samme
// grepene som eleven (setSteer/setSail/setBailing) og ser bare det eleven ser:
// solbrettet ved middag, kursen på solskiva når sola er framme, været, vindkast-
// varselet og sjøen i båten. Ingen robot leser skipets sanne breddegrad.

export interface BotStyle {
    /** Leser middagssola og retter opp kursen. */
    sola: boolean;
    /** Lærer seg havstrømmen fra to middager på rad og holder imot. */
    strom: boolean;
    /** Rever seilet når vindkastet varsles. */
    rev: boolean;
    /** Øser når sjøen i båten blir for høy. */
    os: boolean;
    /** Gjør et grep bare hver n-te tikk (en tregere elev). */
    every: number;
    /** Reagerer bare på så stor andel av vindkastene. */
    revAndel: number;
}

export const BOTS = {
    seende: { sola: true, strom: true, rev: true, os: true, every: 1, revAndel: 1 },
    halvgod: { sola: true, strom: false, rev: true, os: true, every: 3, revAndel: 0.6 },
    'ignorerer-sola': { sola: false, strom: false, rev: true, os: true, every: 1, revAndel: 1 },
} satisfies Record<string, BotStyle>;

interface Mind {
    est: number; // robotens beste gjetning på km nord for linja
    drift: number; // lært havstrøm, km/s
    lastT: number;
    lastNoonDay: number;
    lastNoonAt: number;
    predAtNoon: number;
    tick: number;
    bailing: boolean;
}

export function makeBot(style: BotStyle, rng: () => number) {
    const m: Mind = {
        est: 0,
        drift: 0,
        lastT: 0,
        lastNoonDay: -1,
        lastNoonAt: 0,
        predAtNoon: 0,
        tick: 0,
        bailing: false,
    };
    return (g: Game) => {
        if (g.mode !== 'play') return;
        // Bestikk: roboten vet hvordan den selv har styrt (ikke strømmen).
        const dt = g.t - m.lastT;
        m.lastT = g.t;
        m.est += (Math.sin(g.heading) * g.speed + m.drift) * dt;

        if (style.sola && g.lastNoon && g.lastNoon.day !== m.lastNoonDay) {
            const measured = g.lastNoon.y;
            if (style.strom && m.lastNoonDay >= 0) {
                // Hvor langt bommet bestikket siden forrige måling? Det er strømmen.
                const span = g.t - m.lastNoonAt;
                if (span > DAY * 0.5) m.drift += ((measured - m.est) / span) * 0.8;
            }
            m.est = measured;
            m.lastNoonDay = g.lastNoon.day;
            m.lastNoonAt = g.t;
        }

        m.tick++;
        if (m.tick % style.every !== 0) return;

        // Seilet.
        const w = weatherOf(g);
        if (w === 'storm') {
            if (g.gustWarn > 0 && style.rev && rng() < style.revAndel) setSail(g, 0);
            else if (g.gustWarn <= 0) setSail(g, 1);
        } else setSail(g, 2);

        // Øsing.
        if (style.os) {
            if (g.water > 0.32) m.bailing = true;
            if (g.water < 0.1) m.bailing = false;
            setBailing(g, m.bailing);
        }

        // Roret: bare når solskiva viser kursen.
        if (!sunVisible(g)) {
            setSteer(g, 0);
            return;
        }
        let want = 0;
        if (style.sola) {
            // Styr tilbake mot linja over et par døgn, og hold imot strømmen.
            const v = Math.max(6, g.speed);
            const back = Math.atan2(-m.est, v * DAY * 1.2);
            const hold = Math.asin(Math.max(-0.5, Math.min(0.5, -m.drift / v)));
            want = Math.max(-MAX_HEADING, Math.min(MAX_HEADING, back + hold));
        }
        setSteer(g, Math.max(-1, Math.min(1, (want - g.heading) * 4)));
    };
}

/** Knappemoseren: tilfeldige grep uten plan. */
export function makeRandomBot(rng: () => number) {
    return (g: Game) => {
        if (g.mode !== 'play') return;
        if (rng() < 0.3) setSteer(g, rng() * 2 - 1);
        if (rng() < 0.1) setSail(g, Math.floor(rng() * 3));
        if (rng() < 0.2) setBailing(g, rng() < 0.5);
    };
}
