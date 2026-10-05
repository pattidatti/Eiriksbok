// Robotene i Elleve år. Én kilde for simuleringen (sim.ts) og selvspillet i nettleseren
// (usePlaytest i KongensTallerkener.tsx). De bruker de samme grepene som pekeren:
// swipe(), acceptPage() og takeParliament().

import type { Rng } from '../sim';
import { TUNING } from './tuning';
import type { Game } from './state';
import { naboer } from './levels';
import { aarNa, acceptPage, forbruk, swipe, takeParliament, tinNede, type Hit } from './rules';

type Style = 'seende' | 'halvgod' | 'tar-alt' | 'aldri-parlament' | 'mester-alene';

interface BotOpts {
    /** Handler bare hvert n-te tick (0,2 s per tick). */
    every: number;
    /** Under dette snurret sveiper roboten en tallerken. */
    redd: number;
    /** En nabo med snurr under dette tas med i samme bue (kombo). */
    med: number;
    /** Flest tallerkener i én bue. */
    maksBue: number;
    /** Hvor unøyaktig farten er (andel). */
    sikt: number;
    /**
     * Når en parlamentsøkt tas: 'trenger' (rundt krigen, bare når kista ikke holder `nod` s),
     * 'krig' (hver gang fra 1639), 'alltid', 'aldri'. Før 1639 tar alle unntatt 'alltid' en økt
     * bare i nød (kista holder under `nodFor` s).
     */
    parlament: 'trenger' | 'krig' | 'alltid' | 'aldri';
    nod: number;
    nodFor: number;
    /** Sikter på overspinn på våpenskjoldene (titler). */
    overspinn: boolean;
    /** Stanga som gis bort: den som koster minst (tom først) eller den som vakler mest. */
    ofre: 'billigst' | 'vaklende';
}

export const BOTS: Record<Style, BotOpts> = {
    seende: { every: 3, redd: 0.55, med: 0.75, maksBue: 3, sikt: 0.12, parlament: 'trenger', nod: 9, nodFor: 7, overspinn: true, ofre: 'billigst' },
    halvgod: { every: 4, redd: 0.5, med: 0.6, maksBue: 2, sikt: 0.25, parlament: 'trenger', nod: 4, nodFor: 8, overspinn: false, ofre: 'vaklende' },
    'tar-alt': { every: 4, redd: 0.5, med: 0.6, maksBue: 2, sikt: 0.25, parlament: 'alltid', nod: 0, nodFor: 0, overspinn: false, ofre: 'vaklende' },
    'aldri-parlament': { every: 4, redd: 0.5, med: 0.6, maksBue: 2, sikt: 0.25, parlament: 'aldri', nod: 0, nodFor: 0, overspinn: false, ofre: 'vaklende' },
    'mester-alene': { every: 3, redd: 0.55, med: 0.75, maksBue: 3, sikt: 0.12, parlament: 'aldri', nod: 0, nodFor: 0, overspinn: true, ofre: 'billigst' },
};

/** Hva en stang er verdt for roboten (tom = 0). */
function verdi(g: Game, id: number): number {
    const p = g.slots[id].plate;
    return p ? TUNING.typer[p.kind].gull * 10 + p.spin : 0;
}

/** Stanga roboten gir bort av dem parlamentet tilbyr: den som koster minst, eller den som vakler mest. */
function offer(g: Game, o: BotOpts): number {
    let best = -1;
    let kost = Infinity;
    for (const id of g.tin.tilbud) {
        const s = g.slots[id];
        const k = o.ofre === 'billigst' ? verdi(g, id) : (s.plate?.spin ?? -1);
        if (k < kost) {
            kost = k;
            best = s.id;
        }
    }
    return best;
}

function vilHaParlament(g: Game, o: BotOpts): boolean {
    if (o.parlament === 'aldri') return false;
    if (o.parlament === 'alltid') return true;
    const sek = g.gull / Math.max(0.1, forbruk(g));
    if (aarNa(g) < TUNING.tid.skottene) return sek < o.nodFor;
    return o.parlament === 'krig' || sek < o.nod;
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
        if (g.t < g.bueKlar) return;
        const S = TUNING.snurr;
        const aktive = g.slots.filter((s) => s.state === 'aktiv' && s.plate);
        const lav = aktive.filter((s) => s.plate!.spin < o.redd).sort((a, b) => a.plate!.spin - b.plate!.spin);
        if (!lav.length) return;
        // Buen starter på den som vakler mest og går videre til slakke naboer.
        const bue = [lav[0]];
        while (bue.length < o.maksBue) {
            const sist = bue[bue.length - 1].id;
            const neste = aktive
                .filter((s) => !bue.includes(s) && s.plate!.spin < o.med && naboer(sist, s.id, TUNING.bue.nabo))
                .sort((a, b) => a.plate!.spin - b.plate!.spin)[0];
            if (!neste) break;
            bue.push(neste);
        }
        const hits: Hit[] = bue.map((s) => {
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
