// Robotene i Elleve år. Én kilde for simuleringen (sim.ts) og selvspillet i nettleseren
// (usePlaytest i KongensTallerkener.tsx). De bruker de samme grepene som pekeren:
// swipe(), acceptPage() og takeParliament().

import type { Rng } from '../sim';
import { TUNING } from './tuning';
import type { Game } from './state';
import { aarNa, acceptPage, forbruk, swipe, takeParliament, tinNede, type Hit } from './rules';

type Style = 'seende' | 'halvgod' | 'tar-alt' | 'aldri-parlament';

interface BotOpts {
    /** Handler bare hvert n-te tick (0,2 s per tick). */
    every: number;
    /** Under dette snurret sveiper roboten en tallerken. */
    redd: number;
    /** Flest tallerkener i én bue. */
    maksBue: number;
    /** Hvor unøyaktig farten er (andel). */
    sikt: number;
    /** Når parlamentets tallerken tas: 'krig' (fra 1639 eller når kista er nesten tom), 'alltid', 'aldri'. */
    parlament: 'krig' | 'alltid' | 'aldri';
    /** Hvor mange sekunders forbruk kista må ha før roboten klarer seg uten parlamentet. */
    nod: number;
    /** Sikter på overspinn på våpenskjoldene (titler). */
    overspinn: boolean;
    /** Stanga som ofres til parlamentet: den fattigste (tom først) eller den som vakler mest (lettelse). */
    ofre: 'fattigst' | 'vaklende';
}

export const BOTS: Record<Style, BotOpts> = {
    seende: { every: 3, redd: 0.5, maksBue: 3, sikt: 0.12, parlament: 'krig', nod: 4, overspinn: true, ofre: 'fattigst' },
    halvgod: { every: 4, redd: 0.45, maksBue: 2, sikt: 0.25, parlament: 'krig', nod: 2, overspinn: false, ofre: 'vaklende' },
    'tar-alt': { every: 4, redd: 0.45, maksBue: 2, sikt: 0.25, parlament: 'alltid', nod: 2, overspinn: false, ofre: 'vaklende' },
    'aldri-parlament': { every: 4, redd: 0.45, maksBue: 2, sikt: 0.25, parlament: 'aldri', nod: 2, overspinn: false, ofre: 'vaklende' },
};

/** Stanga roboten ofrer: en tom stang først, ellers tallerkenen som gir minst (eller vakler mest). */
function offer(g: Game, o: BotOpts): number {
    const tom = g.slots.find((s) => s.state === 'tom');
    if (tom && o.ofre === 'fattigst') return tom.id;
    let best = -1;
    let verdi = Infinity;
    for (const s of g.slots) {
        if (s.state !== 'aktiv' || !s.plate) continue;
        const v =
            o.ofre === 'vaklende'
                ? s.plate.spin
                : TUNING.typer[s.plate.kind].gull * 10 + s.plate.spin;
        if (v < verdi) {
            verdi = v;
            best = s.id;
        }
    }
    return best >= 0 ? best : (tom?.id ?? -1);
}

function vilHaParlament(g: Game, o: BotOpts): boolean {
    if (o.parlament === 'aldri') return false;
    if (o.parlament === 'alltid') return true;
    return aarNa(g) >= TUNING.tid.skottene || g.gull < forbruk(g) * o.nod;
}

export function makeBot(o: BotOpts, rng: Rng) {
    let n = 0;
    return (g: Game) => {
        if (g.mode !== 'play') return;
        if (n++ % o.every !== 0) return;
        if (tinNede(g) && vilHaParlament(g, o)) {
            const s = offer(g, o);
            if (s >= 0 && takeParliament(g, s)) return;
        }
        if (g.page && g.gull > g.page.pris + forbruk(g) * 2 && acceptPage(g)) return;
        const S = TUNING.snurr;
        const lav = g.slots
            .filter((s) => s.state === 'aktiv' && s.plate && s.plate.spin < o.redd)
            .sort((a, b) => a.plate!.spin - b.plate!.spin)
            .slice(0, o.maksBue);
        if (!lav.length) return;
        const hits: Hit[] = lav.map((s) => {
            const p = s.plate!;
            const mål = o.overspinn && p.kind === 'vapen' ? 1.12 : 0.88;
            const fart = ((mål - p.spin) / S.perFart) * (1 + (rng() * 2 - 1) * o.sikt);
            return { slot: s.id, fart };
        });
        swipe(g, hits);
    };
}

/** Knappemoseren: tilfeldige sveip med tilfeldig fart, tar imot og drar ned uten plan. */
export function makeRandomBot(rng: Rng) {
    return (g: Game) => {
        if (g.mode !== 'play') return;
        if (rng() < 0.4) return;
        const r = rng();
        if (r < 0.1 && tinNede(g)) {
            takeParliament(g, Math.floor(rng() * g.slots.length));
            return;
        }
        if (r < 0.2 && g.page) {
            acceptPage(g);
            return;
        }
        const aktive = g.slots.filter((s) => s.state === 'aktiv');
        if (!aktive.length) return;
        const k = 1 + Math.floor(rng() * Math.min(3, aktive.length));
        const hits: Hit[] = [];
        for (let i = 0; i < k; i++) {
            const s = aktive[Math.floor(rng() * aktive.length)];
            hits.push({ slot: s.id, fart: rng() * 1.6 });
        }
        swipe(g, hits);
    };
}
