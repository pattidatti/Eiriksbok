// Robotene. De bruker det samme grepet som eleven (send i game.ts) og ser bare det eleven
// ser: båtene, flokkene (antall prikker og fargen på ringen), havna og tønna.

import type { PlaytestBot } from '../playtest';
import type { Rng } from '../sim';
import { send, type Båt, type Flokk, type Game } from './game';
import { dist, framtid, iHavn, årsKost } from './rules';
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
    /** Følger flokken når den har glidd så langt fra båten (px). */
    følg: number;
    /** Sikter dit flokken er om så mange sekunder. */
    forut: number;
    /** Bryr seg om tønna: senker kravene når den er nesten tom. */
    tønneVett: boolean;
    /** Bruker bare så mange båter (resten ligger i havna). */
    maksUte: number;
}

/** Flokken båten ligger ved (eller er på vei til). */
function flokkVed(g: Game, b: Båt): Flokk | null {
    let best: Flokk | null = null;
    let bd = T.fangst.radius * 1.6;
    for (const f of g.flokker) {
        if (f.død) continue;
        const d = dist(b.tx, b.ty, f.x, f.y);
        if (d < bd) {
            bd = d;
            best = f;
        }
    }
    return best;
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
            const opptatt = new Map<number, number>();
            for (const b of båter) {
                if (iHavn(g, b) && b.tx === g.havn.x) continue;
                const f = flokkVed(g, b);
                if (f) opptatt.set(f.id, b.id);
            }
            let ute = båter.filter((b) => !(b.tx === g.havn.x && b.ty === g.havn.y)).length;

            for (const b of båter) {
                const hjemme = b.tx === g.havn.x && b.ty === g.havn.y;
                const f = hjemme ? null : flokkVed(g, b);
                if (f && f.n > f.maks * lav) {
                    // Flokken tåler mer: følg den hvis den glir bort.
                    const p = framtid(f, g.t, v.forut);
                    if (dist(b.tx, b.ty, f.x, f.y) > v.følg && dist(b.tx, b.ty, p.x, p.y) > v.følg)
                        return send(g, b.id, p.x, p.y);
                    continue;
                }
                // Ringen er rød og flokken er liten (eller båten ligger hjemme): finn en flokk som tåler det.
                if (!hjemme) opptatt.delete(f?.id ?? -1);
                if (hjemme && ute >= v.maksUte) continue;
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
                if (mål) {
                    const p = framtid(mål, g.t, v.forut + dist(b.x, b.y, mål.x, mål.y) / T.båt.fart);
                    return send(g, b.id, p.x, p.y);
                }
                if (!hjemme) {
                    ute--;
                    return send(g, b.id, g.havn.x, g.havn.y);
                }
            }
        };
    };
}

export const BOTS: Record<string, BotDef> = {
    forvalter: {
        forventer: 'vinner',
        beskrivelse:
            'Flytter båten når flokken blir liten og ringen rød, lar flokker hvile, én båt per flokk, og følger flokken når den glir bort.',
        make: vett({ lav: 0.55, høy: 0.75, hver: 1, følg: 18, forut: 2, tønneVett: true, maksUte: 99 }),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger samme regel, men tar flokkene lenger ned, reagerer seint og sikter dit flokken er nå.',
        make: vett({ lav: 0.3, høy: 0.5, hver: 4, følg: 30, forut: 0, tønneVett: false, maksUte: 99 }),
    },
    grådig: {
        forventer: 'taper',
        beskrivelse: 'Sender alle båtene til den største flokken og følger den, uten å se på ringen.',
        make: () => {
            let tick = 0;
            return (g) => {
                const lev = g.flokker.filter((f) => !f.død);
                if (!lev.length) return;
                const stor = lev.reduce((a, f) => (f.n > a.n ? f : a));
                const båter = g.båter.filter((b) => !b.kokeri);
                const b = båter[tick++ % båter.length];
                if (dist(b.tx, b.ty, stor.x, stor.y) > 14) {
                    const p = framtid(stor, g.t, 1 + dist(b.x, b.y, stor.x, stor.y) / T.båt.fart);
                    send(g, b.id, p.x, p.y);
                }
            };
        },
    },
    sparsom: {
        forventer: 'taper',
        beskrivelse: 'Passer godt på hvalene, men bruker bare én båt - de andre ligger i havna og koster olje.',
        make: vett({ lav: 0.5, høy: 0.7, hver: 1, følg: 18, forut: 2, tønneVett: false, maksUte: 1 }),
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
