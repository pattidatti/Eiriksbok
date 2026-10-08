// Robotene. De bruker det samme grepet som eleven (send i game.ts) og ser bare det eleven
// ser: båtene, flokkene (antall prikker og fargen på ringen), havna og tønna.

import type { PlaytestBot } from '../playtest';
import type { Rng } from '../sim';
import { send, type Båt, type Flokk, type Game } from './game';
import { dist, årsKost } from './rules';
import { TUNING } from './tuning';

const T = TUNING;

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => (g: Game) => void;
}

interface Vett {
    /** Flytter båten bort når flokken er under denne andelen av maks. */
    lav: number;
    /** Sender bare båter til flokker over denne andelen av maks. */
    høy: number;
    /** Gjør et grep bare hvert n-te tick. */
    hver: number;
    /** Bryr seg om tønna: senker kravene når den er nesten tom. */
    tønneVett: boolean;
    /** Sender høyst så mange båter ut (resten ligger i havna). */
    maksUte: number;
    /** Henter båter uten flokk hjem, så de koster lite. */
    hjemTom: boolean;
}

/** Flokken båten ligger ved (eller er på vei til). */
function flokkVed(g: Game, b: Båt): Flokk | null {
    if (b.hjemme) return null;
    return g.flokker.find((f) => f.id === b.følger && !f.død) ?? null;
}

function vett(v: Vett) {
    return (_rng: Rng) => {
        let tick = 0;
        let kokeriSist = -99;
        return (g: Game) => {
            if (tick++ % v.hver) return;
            const presset = v.tønneVett && g.tønne < årsKost(g) * 1.2;
            const lav = presset ? v.lav * 0.7 : v.lav;
            const høy = presset ? v.høy * 0.75 : v.høy;

            // Kokeriet: legg det midt i de levende flokkene.
            const kokeri = g.båter.find((b) => b.kokeri);
            if (kokeri && g.t - kokeriSist > 8) {
                const lev = g.flokker.filter((f) => !f.død);
                const sum = lev.reduce((s, f) => s + f.n, 0) || 1;
                const x = lev.reduce((s, f) => s + f.cx * f.n, 0) / sum;
                const y = lev.reduce((s, f) => s + f.cy * f.n, 0) / sum;
                kokeriSist = g.t;
                if (dist(kokeri.tx, kokeri.ty, x, y) > 60) return send(g, kokeri.id, x, y);
            }

            const båter = g.båter.filter((b) => !b.kokeri);
            const opptatt = new Set<number>();
            for (const b of båter) {
                const f = flokkVed(g, b);
                if (f) opptatt.add(f.id);
            }
            const ute = båter.filter((b) => !b.hjemme).length;

            for (const b of båter) {
                const f = flokkVed(g, b);
                // Flokken tåler mer: la båten ligge (den følger flokken selv).
                if (f && f.n > f.maks * lav) continue;
                if (b.hjemme && ute >= v.maksUte) continue;
                // Ringen er rød og flokken er liten (eller båten ligger hjemme): finn en flokk som tåler det.
                let mål: Flokk | null = null;
                let score = -Infinity;
                for (const k of g.flokker) {
                    if (k.død || opptatt.has(k.id) || k.n < k.maks * høy) continue;
                    const s = k.n - dist(k.x, k.y, g.havn.x, g.havn.y) * 0.01;
                    if (s > score) {
                        score = s;
                        mål = k;
                    }
                }
                if (mål) return send(g, b.id, mål.x, mål.y);
                // Ingen flokk tåler mer: båten går hjem og koster lite.
                if (b.hjemme) continue;
                if (v.hjemTom) return send(g, b.id, g.havn.x, g.havn.y);
                // Halvgod: drar båten bort fra den lille flokken, men lar den ligge ute og koste full pris.
                if (f) return send(g, b.id, (f.x + g.havn.x) / 2, (f.y + g.havn.y) / 2);
            }
        };
    };
}

export const BOTS: Record<string, BotDef> = {
    forvalter: {
        forventer: 'vinner',
        beskrivelse:
            'Sender ut så mange båter som det finnes store flokker, én båt per flokk, flytter båten når flokken blir liten og lar den hvile - båter uten flokk går hjem.',
        make: vett({ lav: 0.55, høy: 0.75, hver: 1, tønneVett: true, maksUte: 99, hjemTom: true }),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger samme regel, men tar flokkene lenger ned før den flytter, reagerer seint, og lar båter uten flokk ligge ute og koste full pris.',
        make: vett({ lav: 0.3, høy: 0.5, hver: 4, tønneVett: false, maksUte: 99, hjemTom: false }),
    },
    grådig: {
        forventer: 'taper',
        beskrivelse: 'Sender alle båtene ut til den største flokken, uten å se på ringen.',
        make: () => {
            let tick = 0;
            return (g) => {
                const lev = g.flokker.filter((f) => !f.død);
                if (!lev.length) return;
                const stor = lev.reduce((a, f) => (f.n > a.n ? f : a));
                const båter = g.båter.filter((b) => !b.kokeri);
                const b = båter[tick++ % båter.length];
                if (b.følger !== stor.id) send(g, b.id, stor.x, stor.y);
            };
        },
    },
    sparsom: {
        forventer: 'taper',
        beskrivelse: 'Passer godt på hvalene, men sender bare én båt ut - for lite olje til å betale for resten.',
        make: vett({ lav: 0.5, høy: 0.7, hver: 1, tønneVett: false, maksUte: 1, hjemTom: true }),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Drar en tilfeldig båt til et tilfeldig sted på kartet innimellom.',
        make: (rng) => (g) => {
            if (rng() > 0.15) return;
            const b = g.båter[Math.floor(rng() * g.båter.length)];
            send(g, b.id, rng() * T.flate.w, rng() * T.flate.h);
        },
    },
};
