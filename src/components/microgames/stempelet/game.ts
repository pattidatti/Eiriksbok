// Kjerneløkka i Stempelet: `update(g, dt)` og grepene eleven (og robotene) har:
// `sikt` (før stempelet), `trykk` (hold inne) og `slipp` (slaget). Ingen React.

import { BRETT, PLASSER } from './levels';
import { blirTilFornyelse, reis, slå, trekkBetaler } from './rules';
import {
    husleie,
    lagPass,
    ledigPerson,
    ledigPlass,
    papirløse,
    type Game,
    type Pass,
} from './state';
import { TUNING } from './tuning';

export { newGame, type Game } from './state';

const P = TUNING.pass;

/** Bordets kant: stempelet kan ikke føres utenfor. */
const BORD = { x0: -5.6, x1: 5.6, z0: -2, z1: 2.4 };

export function sikt(g: Game, x: number, z: number) {
    g.stempel.tx = Math.max(BORD.x0, Math.min(BORD.x1, x));
    g.stempel.tz = Math.max(BORD.z0, Math.min(BORD.z1, z));
}

export function siktPlass(g: Game, plass: number) {
    const p = PLASSER[plass];
    sikt(g, p.x, p.z);
}

export function trykk(g: Game) {
    if (g.mode !== 'play') return;
    if (g.stempel.hold === null) g.stempel.hold = 0;
}

export function slipp(g: Game) {
    if (g.mode !== 'play') return;
    const h = g.stempel.hold;
    if (h === null) return;
    g.stempel.hold = null;
    slå(g, h);
}

/** Tastaturet: flytt stempelet til neste pass (retning 1 eller -1), ordnet fra venstre. */
export function nestePass(g: Game, retning: 1 | -1) {
    if (!g.pass.length) return;
    const ordnet = [...g.pass].sort(
        (a, b) => PLASSER[a.plass].x - PLASSER[b.plass].x || PLASSER[a.plass].z - PLASSER[b.plass].z
    );
    const st = g.stempel;
    let i = ordnet.findIndex((p) => PLASSER[p.plass].x === st.tx && PLASSER[p.plass].z === st.tz);
    i =
        i < 0
            ? retning > 0
                ? 0
                : ordnet.length - 1
            : (i + retning + ordnet.length) % ordnet.length;
    siktPlass(g, ordnet[i].plass);
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    const brett = BRETT[g.brett];
    g.t += dt;
    g.iÅr += dt;

    // Stempelet henger etter pekeren, som om det veier noe.
    const st = g.stempel;
    const k = Math.min(1, dt * TUNING.stempel.følg);
    st.x += (st.tx - st.x) * k;
    st.z += (st.tz - st.z) * k;
    if (st.hold !== null) st.hold += dt;

    // Båndene krymper.
    for (const p of [...g.pass]) {
        if (p.grå) continue;
        p.blir -= dt;
        if (p.blir <= 0 && !p.lomme) {
            reis(g, p);
            continue;
        }
        p.igjen -= dt;
        const andel = p.igjen / p.varer;
        if (!p.lomme && andel < P.fornyFra) blirTilFornyelse(g, p);
        if (andel < P.ristFra) p.rist += dt;
        // Brett 1: et pass går ikke ut før det har ristet en stund.
        if (g.brett === 0 && p.igjen <= 0 && p.rist < 4) p.igjen = 0.01;
        if (p.igjen <= 0) {
            g.pass.splice(g.pass.indexOf(p), 1);
            g.skuff.push({ person: p.person, om: TUNING.grå.venter });
            g.mistet.push({ person: p.person, år: brett.år });
            g.rekke = 0;
            g.ut.push({ type: 'utløpt', id: p.id, plass: p.plass });
        }
    }

    // De papirløse i skuffen kommer tilbake som grå saker når det er plass.
    for (const v of [...g.skuff]) {
        v.om -= dt;
        if (v.om > 0) continue;
        const plass = ledigPlass(g, brett.maks);
        if (plass === null) continue;
        g.skuff.splice(g.skuff.indexOf(v), 1);
        const p = lagPass(g, plass, v.person);
        p.igjen = 0;
        p.grå = true;
        p.betaler = false;
        p.lomme = 'tom';
        g.valg++;
        g.ut.push({ type: 'tilbake', id: p.id });
    }

    // Nye pass.
    g.nyOm -= dt;
    if (g.nyOm <= 0) {
        g.nyOm += brett.nyHvert;
        const plass = ledigPlass(g, brett.maks);
        if (plass !== null) {
            const p = lagPass(g, plass, ledigPerson(g));
            p.igjen = p.varer * (P.nyttMin + g.rng() * (P.nyttMaks - P.nyttMin));
            trekkBetaler(g, p, brett.tom);
            if (!p.betaler) parMedMynt(g, p);
            g.ut.push({ type: 'nyttPass', id: p.id });
        }
    }

    // Historisk bølge: mange nye pass på en gang (1935: flyktninger fra Saar).
    if (brett.bølge && !g.bølgeKom && g.iÅr >= brett.bølge.ved) {
        g.bølgeKom = true;
        let n = 0;
        for (let i = 0; i < brett.bølge.antall; i++) {
            const plass = ledigPlass(g, brett.maks);
            if (plass === null) break;
            const p = lagPass(g, plass, ledigPerson(g, true));
            p.igjen = p.varer * (P.nyttMin + g.rng() * (P.nyttMaks - P.nyttMin));
            trekkBetaler(g, p, brett.tom);
            g.ut.push({ type: 'nyttPass', id: p.id });
            n++;
        }
        g.valg += n;
        g.ut.push({ type: 'bølge', antall: n });
    }

    // Dilemma: to pass går ut nesten samtidig. Visningen fryser et øyeblikk og lyser opp begge.
    if (g.t - g.sistDilemma > TUNING.dilemma.pause) {
        const nær = g.pass.filter((p) => !p.grå && p.lomme && p.igjen < TUNING.dilemma.igjen);
        if (nær.length >= 2) {
            g.sistDilemma = g.t;
            g.ut.push({ type: 'dilemma', ider: nær.slice(0, 2).map((p) => p.id) });
        }
    }

    // Frimerkearket.
    if (g.frimerkeVed !== null && g.iÅr >= g.frimerkeVed) {
        g.frimerkeVed = null;
        g.frimerke = { igjen: TUNING.frimerke.ligger };
        g.valg++;
        g.ut.push({ type: 'frimerkeKom' });
    }
    if (g.frimerke) {
        g.frimerke.igjen -= dt;
        if (g.frimerke.igjen <= 0) {
            g.frimerke = null;
            g.ut.push({ type: 'frimerkeBort' });
        }
    }

    if (papirløse(g) >= TUNING.tap.papirløse) return tap(g, 'papirløse');

    // Årsskiftet: husleia trekkes fra kassa.
    if (g.iÅr >= TUNING.år.sekunder) {
        const leie = husleie(g.brett);
        if (g.kasse < leie) return tap(g, 'stengt');
        g.kasse -= leie;
        g.ut.push({ type: 'husleie', beløp: leie });
        if (g.brett >= BRETT.length - 1) {
            g.mode = 'won';
            g.ut.push({ type: 'seier' });
            return;
        }
        g.brett++;
        g.bølgeKom = false;
        g.iÅr -= TUNING.år.sekunder;
        const f = TUNING.frimerke;
        g.frimerkeVed = BRETT[g.brett].frimerke ? f.fraSek + g.rng() * (f.tilSek - f.fraSek) : null;
        g.ut.push({ type: 'nyttÅr', år: BRETT[g.brett].år, brett: g.brett });
    }
}

/**
 * En tom lomme kommer i par med et mynt-pass: båndene går tomme omtrent samtidig, så eleven
 * ikke rekker begge og må velge hvem som venter.
 */
function parMedMynt(g: Game, p: Pass) {
    const mynt = g.pass.filter(
        (q) => q !== p && q.betaler && !q.grå && !q.lomme && q.igjen / q.varer > P.fornyFra
    );
    if (!mynt.length) return;
    const q = mynt.reduce((a, b) => (a.igjen > b.igjen ? a : b));
    p.igjen = Math.min(p.varer, q.igjen + TUNING.pass.parAvstand * (g.rng() - 0.5));
}

function tap(g: Game, årsak: 'papirløse' | 'stengt') {
    g.mode = 'lost';
    g.årsak = årsak;
    g.stempel.hold = null;
    g.ut.push({ type: 'tap', årsak });
}

export function press(g: Game): number {
    const p = TUNING.press;
    const bord = Math.min(1, g.pass.length / p.maksBord);
    const tomme = Math.min(1, BRETT[g.brett].tom / p.maksTomme);
    return p.bord * bord + p.tomme * tomme;
}

export function framdrift(g: Game): number {
    const S = TUNING.år.sekunder;
    return Math.min(1, (g.brett * S + g.iÅr) / (BRETT.length * S));
}

/** Årstallet nå. */
export function årstall(g: Game): number {
    return BRETT[g.brett].år;
}
