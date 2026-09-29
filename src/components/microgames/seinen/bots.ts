// Robotene for Seinen snur. De styrer med det samme grepet som eleven (steerTo -
// skipet følger pekeren), bare uten musa. Brukes både i nettleseren (usePlaytest) og i
// simuleringen.

import {
    H,
    ROUEN_Y,
    VOLLEY_R,
    riverHalf,
    riverX,
    steerTo,
    toggleChain,
    type Boat,
    type Game,
} from './game';

type Rng = () => number;

interface BotOpts {
    /** Nytt mål bare hvert n-te kall (ett kall = 0,2 s spilltid). */
    every: number;
    /** Sjanse for å se pilsalven og styre unna. */
    dodge: number;
    /** Holder seg unna borgene før 911. */
    fortSense: boolean;
    /** Sjanse for å styre rundt frankiske båter etter 911. */
    careful: number;
    /** Følger avtalen: etter 911 er målet vikingskip, ikke sølv. */
    treaty: boolean;
    /** Sikteunøyaktighet (px). */
    aim: number;
    /** Kjettingen: 'vakt' heiser den mot vikinger og senker den for kongens båter,
     *  'stenger' heiser den mot vikinger og bryr seg ikke om kongen. */
    chain: 'vakt' | 'stenger' | 'aldri';
}

export const BOTS: Record<string, BotOpts> = {
    seende: { every: 1, dodge: 1, fortSense: true, careful: 1, treaty: true, aim: 6, chain: 'vakt' },
    halvgod: { every: 3, dodge: 0.6, fortSense: true, careful: 0.85, treaty: true, aim: 20, chain: 'vakt' },
    plyndrer: { every: 1, dodge: 1, fortSense: true, careful: 0, treaty: false, aim: 6, chain: 'stenger' },
};

const inRiver = (x: number, y: number): [number, number] => {
    const cx = riverX(y);
    const hw = riverHalf(y) - 20;
    return [Math.max(cx - hw, Math.min(cx + hw, x)), Math.max(20, Math.min(H - 16, y))];
};

/** Mål litt forbi båten, så skipet har fart når det treffer. */
function ramPoint(g: Game, b: Boat): [number, number] {
    const s = g.ship;
    const d = Math.hypot(b.x - s.x, b.y - s.y);
    const tau = Math.min(1.2, d / 300);
    const bx = b.x;
    const by = b.y + b.v * tau;
    const dx = bx - s.x;
    const dy = by - s.y;
    const dd = Math.hypot(dx, dy) || 1;
    return [bx + (dx / dd) * 90, by + (dy / dd) * 90];
}

export function makeBot(opts: BotOpts, rng: Rng) {
    let n = 0;
    return (g: Game) => {
        if (g.mode !== 'play') return;
        n++;
        if (n % opts.every !== 0) return;
        const s = g.ship;
        const jitter = (p: [number, number]): [number, number] =>
            inRiver(p[0] + (rng() - 0.5) * 2 * opts.aim, p[1] + (rng() - 0.5) * 2 * opts.aim);

        if (g.phase === 'plyndring') {
            // Pilene: styr ut av sirkelen.
            const v = g.volleys.find(
                (x) => Math.hypot(x.x - s.x, x.y - s.y) < VOLLEY_R + 46 && rng() < opts.dodge
            );
            if (v) {
                const dx = s.x - v.x || 1;
                const dy = s.y - v.y;
                const d = Math.hypot(dx, dy) || 1;
                steerTo(g, ...inRiver(s.x + (dx / d) * 160, s.y + (dy / d) * 160 + 40));
                return;
            }
            const safe = (x: number, y: number) =>
                !opts.fortSense || g.forts.every((f) => Math.hypot(x - f.x, y - f.y) > f.range + 12);
            const barge = g.boats
                .filter((b) => b.kind === 'frank' && !b.fleeing && b.y > 10 && safe(b.x, b.y + 30))
                .sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
            if (barge) {
                const p = ramPoint(g, barge);
                steerTo(g, ...jitter(safe(p[0], p[1]) ? p : [barge.x, barge.y + 20]));
            } else if (!safe(s.x, s.y)) steerTo(g, ...inRiver(riverX(600), 600));
            else steerTo(g, ...inRiver(riverX(520), 520));
            return;
        }

        // Etter 911.
        const boats = g.boats.filter((b) => !b.fleeing && b.y < H + 10);
        // Kjettingen ved Rouen.
        const vik = boats.filter((b) => b.kind === 'viking' && b.y > ROUEN_Y);
        const vikClose = vik.some((b) => b.y < ROUEN_Y + 70);
        const vikNear = vik.some((b) => b.y < ROUEN_Y + 240);
        const kingNear = boats.some((b) => b.kind === 'frank' && b.y > ROUEN_Y - 110 && b.y < ROUEN_Y);
        let want = vikClose || vikNear;
        if (opts.chain === 'vakt') {
            want = vikClose || (vikNear && !kingNear);
            if (g.chain.wait > 1.6) want = false;
            if (g.chain.hp < 0.2 && !vikClose) want = false;
        }
        if (opts.chain !== 'aldri' && g.chain.broken <= 0 && g.chain.up !== want) toggleChain(g);
        let target: Boat | undefined;
        if (opts.treaty) {
            // Mest presserende først: skipet som er nærmest Rouen i tid.
            // Skip som ligger fast foran kjettingen, kan vente - så lenge kjettingen holder.
            const urgency = (b: Boat) =>
                (b.y - ROUEN_Y) / Math.max(20, Math.abs(b.v)) +
                (b.caught && g.chain.up && g.chain.hp > 0.35 ? 2.5 : 0);
            target = boats
                .filter((b) => b.kind === 'viking')
                .sort((a, b) => urgency(a) - urgency(b))[0];
        } else {
            target = boats.sort(
                (a, b) =>
                    (a.kind === 'frank' ? 0 : 1) - (b.kind === 'frank' ? 0 : 1) ||
                    Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y)
            )[0];
        }
        let p: [number, number] = target ? ramPoint(g, target) : [riverX(ROUEN_Y + 130), ROUEN_Y + 130];
        // Styr rundt frankiske båter som ligger i veien.
        if (opts.treaty && rng() < opts.careful) {
            for (const b of boats) {
                if (b.kind !== 'frank') continue;
                const ax = p[0] - s.x;
                const ay = p[1] - s.y;
                const len = Math.hypot(ax, ay) || 1;
                const tx = ((b.x - s.x) * ax + (b.y - s.y) * ay) / len;
                if (tx < -30 || tx > len + 30) continue;
                const off = ((b.x - s.x) * ay - (b.y - s.y) * ax) / len;
                if (Math.abs(off) > 70) continue;
                const d = Math.hypot(b.x - s.x, b.y - s.y);
                const vikingNear = boats.some(
                    (x) => x.kind === 'viking' && Math.hypot(x.x - s.x, x.y - s.y) < 110
                );
                if (d < 75 && !vikingNear) {
                    // For nær: brems og gli til siden.
                    const side = off > 0 ? -1 : 1;
                    p = [s.x + (ay / len) * side * 60, s.y - (ax / len) * side * 60];
                } else {
                    const side = off > 0 ? -1 : 1;
                    p = [b.x + (ay / len) * side * 95, b.y - (ax / len) * side * 95];
                }
                break;
            }
        }
        steerTo(g, ...jitter(p));
    };
}

/** Knappemoseren: styrer mot tilfeldige punkter i elva. */
export function makeRandomBot(rng: Rng) {
    let n = 0;
    return (g: Game) => {
        if (g.mode !== 'play') return;
        n++;
        if (n % 3 !== 0) return;
        if (rng() < 0.08) toggleChain(g);
        const y = 30 + rng() * (H - 60);
        steerTo(g, ...inRiver(riverX(y) + (rng() - 0.5) * 2 * riverHalf(y), y));
    };
}
