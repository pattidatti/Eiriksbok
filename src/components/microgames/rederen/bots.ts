// Robotene. De bruker det samme grepet som eleven (send i game.ts) og ser bare det eleven
// ser: båtene, flokkene (antall prikker og fargen på ringen), havna og tønna.

import type { PlaytestBot } from '../playtest';
import type { Rng } from '../sim';
import { send, type Båt, type Flokk, type Game } from './game';
import { dist, fatPåVei, markedÅpent, årsKost } from './rules';
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
    /** Kjøper en båt til salgs når tønna har så mange års drift i tillegg til prisen (null = aldri). */
    kjøpReserve: number | null;
    /**
     * Oljemarkedet: 'ser' holder fatene i år under grensa (tellerverket ved tønna), 'lærer'
     * gjør det først etter at prisen har falt én gang, 'aldri' bryr seg ikke.
     */
    marked: 'ser' | 'lærer' | 'aldri';
}

/** Flokken båten ligger ved (eller er på vei til). */
function flokkVed(g: Game, b: Båt): Flokk | null {
    if (b.hjemme) return null;
    return g.flokker.find((f) => f.id === b.følger && !f.død && !f.fredet) ?? null;
}

/** Midt i de levende flokkene, vektet etter antall hval. */
function midten(g: Game) {
    const lev = g.flokker.filter((f) => !f.død);
    const sum = lev.reduce((s, f) => s + f.n, 0) || 1;
    return {
        x: lev.reduce((s, f) => s + f.cx * f.n, 0) / sum,
        y: lev.reduce((s, f) => s + f.cy * f.n, 0) / sum,
    };
}

function vett(v: Vett) {
    return (_rng: Rng) => {
        let tick = 0;
        let kokeriSist = -99;
        let settKrakk = false;
        return (g: Game) => {
            if (g.pris < 1) settKrakk = true;
            if (tick++ % v.hver) return;
            // Markedet: fatene i år (pluss dem som ruller hjem) når grensa - hent en båt hjem.
            const passerMarked = v.marked === 'ser' || (v.marked === 'lærer' && settKrakk);
            const passer = passerMarked && markedÅpent(g);
            // Måleren ved tønna: lageret i verden pluss fatene som ruller hjem. Nær streken:
            // hent en båt hjem. Godt under: send flere ut.
            const lager = g.lager + fatPåVei(g);
            const fullt = passer && lager > T.marked.grense * 0.85;
            const plass = !passer || lager < T.marked.grense * 0.6;
            const presset = v.tønneVett && g.tønne < årsKost(g) * 1.2;
            const lav = presset ? v.lav * 0.7 : v.lav;
            const høy = presset ? v.høy * 0.75 : v.høy;

            // Kjøp: en båt til salgs, og en stor flokk uten båt å sende den til.
            const tilSalgs = g.båter.find((b) => b.tilbud);
            if (tilSalgs && v.kjøpReserve !== null && !fullt) {
                const har = g.tønne >= tilSalgs.pris + årsKost(g) * v.kjøpReserve;
                const ledig = g.flokker.filter(
                    (k) =>
                        !k.død &&
                        !k.fredet &&
                        k.n >= k.maks * v.høy &&
                        !g.båter.some((b) => b.følger === k.id)
                );
                if (har && (tilSalgs.kokeri || ledig.length)) {
                    const k = tilSalgs.kokeri ? midten(g) : ledig[0];
                    return send(g, tilSalgs.id, k.x, k.y);
                }
            }

            // Kokeriet: legg det midt i de levende flokkene.
            const kokeri = g.båter.find((b) => b.kokeri && !b.tilbud);
            if (kokeri && g.t - kokeriSist > 8) {
                const { x, y } = midten(g);
                kokeriSist = g.t;
                if (dist(kokeri.tx, kokeri.ty, x, y) > 60) return send(g, kokeri.id, x, y);
            }

            const båter = g.båter.filter((b) => !b.kokeri && !b.tilbud);
            const opptatt = new Set<number>();
            for (const b of båter) {
                const f = flokkVed(g, b);
                if (f) opptatt.add(f.id);
            }
            const ute = båter.filter((b) => !b.hjemme).length;

            if (fullt) {
                // For mange båter ute for markedet: båten ved den minste flokken går hjem.
                let minst: Båt | null = null;
                for (const b of båter) {
                    if (b.hjemme) continue;
                    const f = flokkVed(g, b);
                    if (!minst || (f?.n ?? -1) < (flokkVed(g, minst)?.n ?? -1)) minst = b;
                }
                if (minst) return send(g, minst.id, g.havn.x, g.havn.y);
            }

            for (const b of båter) {
                const f = flokkVed(g, b);
                // Flokken tåler mer: la båten ligge (den følger flokken selv).
                if (f && f.n > f.maks * lav) continue;
                // Markedet tåler ikke flere fat i år: båtene i havna blir liggende.
                if (b.hjemme && (ute >= v.maksUte || !plass)) continue;
                // Ringen er rød og flokken er liten (eller båten ligger hjemme): finn en flokk som tåler det.
                let mål: Flokk | null = null;
                let score = -Infinity;
                for (const k of g.flokker) {
                    if (k.død || k.fredet || opptatt.has(k.id) || k.n < k.maks * høy) continue;
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
            'Kjøper en båt når tønna har råd og en stor flokk er ledig, sender én båt per stor flokk, flytter båten når flokken blir liten og lar den hvile - båter uten flokk går hjem. Fra 1929 henter den båtene hjem når årets fat nærmer seg markedsgrensa.',
        make: vett({
            lav: 0.55,
            høy: 0.75,
            hver: 1,
            tønneVett: true,
            maksUte: 99,
            hjemTom: true,
            kjøpReserve: 1.5,
            marked: 'ser',
        }),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger samme regel, men tar flokkene lenger ned før den flytter, reagerer seint, og lar båter uten flokk ligge ute og koste full pris. Passer på markedsgrensa først etter at prisen har falt én gang.',
        make: vett({
            lav: 0.3,
            høy: 0.5,
            hver: 4,
            tønneVett: false,
            maksUte: 99,
            hjemTom: true,
            kjøpReserve: 0.5,
            marked: 'lærer',
        }),
    },
    grådig: {
        forventer: 'taper',
        beskrivelse:
            'Kjøper alt den har råd til og sender båtene til den største flokken. Blir liggende til flokken er tom, uten å se på ringen.',
        make: () => {
            let tick = 0;
            return (g) => {
                const lev = g.flokker.filter((f) => !f.død && !f.fredet);
                if (!lev.length) return;
                const stor = lev.reduce((a, f) => (f.n > a.n ? f : a));
                // Kjøper alt som står til salgs, så fort tønna har råd.
                const salg = g.båter.find((b) => b.tilbud && !b.kokeri && g.tønne >= b.pris);
                if (salg) return send(g, salg.id, stor.x, stor.y);
                const båter = g.båter.filter((b) => !b.kokeri && !b.tilbud);
                const b = båter[tick++ % båter.length];
                // Blir liggende til flokken er tom, så går den til den største.
                const nå = g.flokker.find((f) => f.id === b.følger && !f.død);
                if (!nå) send(g, b.id, stor.x, stor.y);
            };
        },
    },
    sparsom: {
        forventer: 'taper',
        beskrivelse:
            'Passer godt på hvalene, men kjøper aldri båter og har bare én ute - for lite olje til å betale for stasjonen.',
        make: vett({
            lav: 0.5,
            høy: 0.7,
            hver: 1,
            tønneVett: false,
            maksUte: 1,
            hjemTom: true,
            kjøpReserve: null,
            marked: 'aldri',
        }),
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
