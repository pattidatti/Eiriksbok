// Kjerneløkka: update(g, dt) flytter klokka, folkene i trappene og over landgangen,
// båtene på davitene og sjekker fristene. Grepene (bytt, hold) står i rules.ts.
// Seier: redd flere enn i 1912 (TUNING.seier) før natta er over. En tapt båt er
// ikke tap i seg selv - plassene i den er bare borte.

import { BRETT, type Side } from './levels';
import { brukt, fase, firetid, frist, gåOmBord, mellom, taptePlasser, tomme } from './rules';
import type { Game, Klasse } from './state';
import { TUNING } from './tuning';

export { newGame, type Game } from './state';

const SIDER: Side[] = ['B', 'S'];

function nyeGrupper(g: Game) {
    for (const k of [1, 2, 3] as Klasse[]) {
        const kl = TUNING.klasser[k];
        if (g.t < kl.åpner || g.t < g.nesteGruppe[k]) continue;
        const f = fase(k, g.t);
        const antall = Math.round(mellom(g, f.størrelse));
        g.grupper.push({
            id: g.nesteId++,
            klasse: k,
            antall,
            pos: 0,
            gang: mellom(g, kl.gang),
            iKø: false,
        });
        g.nesteGruppe[k] = g.t + mellom(g, f.intervall);
    }
}

function gå(g: Game, dt: number) {
    const port = TUNING.port.pos;
    for (const gr of g.grupper) {
        gr.pos += dt / gr.gang;
        // Gitterporten for tredje klasse: de samler seg bak den til den åpnes.
        if (gr.klasse === 3 && g.t < g.portÅpner && gr.pos > port) gr.pos = port;
        if (gr.pos >= 1) {
            gr.pos = 1;
            gr.iKø = true;
            g.kø.push(gr);
            g.hendelser.push({ t: g.t, slag: 'ankommer' });
        }
    }
    g.grupper = g.grupper.filter((gr) => !gr.iKø);
}

function davitene(g: Game) {
    if (g.t < g.kortTil) return;
    for (const side of SIDER) {
        if (g.davit[side] !== null || g.t < g.svingTil[side]) continue;
        const neste = g.båter.find(
            (b) => b.brett === g.brett && b.side === side && b.tilstand === 'venter'
        );
        if (!neste) continue;
        neste.tilstand = 'henger';
        g.davit[side] = neste.nr;
    }
}

function firing(g: Game, dt: number) {
    if (!g.hold) return;
    const i = g.davit[g.hold];
    if (i === null) return;
    const b = g.båter[i];
    g.holdT += dt;
    if (g.holdT < TUNING.firing.holdForsinkelse) return;
    if (b.tilstand === 'henger') g.valg++; // å fire nå er et valg
    b.tilstand = 'fires';
    b.ned += dt / firetid(b, g.t);
    if (b.ned >= 1) {
        b.ned = 1;
        b.tilstand = 'nede';
        b.nedeKl = g.t;
        g.davit[b.side] = null;
        g.svingTil[b.side] = g.t + TUNING.firing.svingUt;
        g.hold = null;
        g.holdT = 0;
        g.hendelser.push({ t: g.t, slag: 'nede', side: b.side });
    }
}

function frister(g: Game) {
    for (const b of g.båter) {
        if (b.tilstand === 'nede' || b.tilstand === 'tapt' || b.tilstand === 'venter') continue;
        const f = frist(b);
        if (g.t < f.t) continue;
        // Lunta har brent ned: båten og plassene i den er borte. Runden går videre.
        b.tilstand = 'tapt';
        g.tapte.push({ navn: b.navn, årsak: f.årsak, kl: g.t });
        if (g.davit[b.side] === b.nr) {
            g.davit[b.side] = null;
            g.svingTil[b.side] = g.t + TUNING.firing.svingUt;
            if (g.hold === b.side) {
                g.hold = null;
                g.holdT = 0;
            }
        }
        g.hendelser.push({ t: g.t, slag: 'tapt', tekst: b.navn });
    }
    // Båter som aldri rakk å svinge ut, er også borte når fristen er passert.
    for (const b of g.båter)
        if (b.tilstand === 'venter' && g.t >= frist(b).t) {
            b.tilstand = 'tapt';
            g.tapte.push({ navn: b.navn, årsak: frist(b).årsak, kl: g.t });
        }
}

/** Natta er over: alle båtene er nede eller tapt, eller klokka har passert 02.20. */
function slutt(g: Game) {
    g.mode = brukt(g) > TUNING.seier ? 'won' : 'lost';
    if (g.mode === 'lost') g.årsak = tomme(g) >= taptePlasser(g) ? 'tomme' : 'tapt';
    g.hendelser.push({ t: g.t, slag: g.mode === 'won' ? 'vunnet' : 'tapt' });
}

function brettFerdig(g: Game) {
    const mine = g.båter.filter((b) => b.brett === g.brett);
    if (!mine.every((b) => b.tilstand === 'nede' || b.tilstand === 'tapt')) return;
    g.brett++;
    if (g.brett >= BRETT.length) return slutt(g);
    g.kortTil = g.t + TUNING.firing.kort;
    g.hendelser.push({ t: g.t, slag: 'brett', tekst: BRETT[g.brett].tittel });
}

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    const før = g.t;
    g.t += dt;
    for (const r of TUNING.raketter)
        if (før < r && g.t >= r) {
            g.raketter.push(r);
            g.hendelser.push({ t: g.t, slag: 'rakett' });
        }
    nyeGrupper(g);
    gå(g, dt);
    davitene(g);
    gåOmBord(g, dt);
    firing(g, dt);
    frister(g);
    brettFerdig(g);
    if (g.mode === 'play' && g.t >= TUNING.slutt) slutt(g);
    if (g.hendelser.length > 60) g.hendelser.splice(0, g.hendelser.length - 60);
}
