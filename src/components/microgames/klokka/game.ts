// Kjerneløkka: update(g, dt) flytter klokka, folkene i trappene og over landgangen,
// båtene på davitene og sjekker fristene. Grepene (bytt, hold) står i rules.ts.
// Seier: redd flere enn i 1912 (TUNING.seier) før natta er over. En tapt båt er
// ikke tap i seg selv - plassene i den er bare borte.

import { BRETT, type Side } from './levels';
import {
    alvor,
    brukt,
    fase,
    firetid,
    frist,
    gåOmBord,
    mellom,
    portFast,
    taptePlasser,
    tomme,
} from './rules';
import type { Game, Klasse } from './state';
import { TUNING } from './tuning';

export { newGame, type Game } from './state';

const SIDER: Side[] = ['B', 'S'];

/**
 * Nye grupper går opp fra lugarene. Første og andre klasse kommer fortere jo mer
 * alvor det er (båter som er nede, raketter). Hver klasse har et fast antall folk.
 */
function nyeGrupper(g: Game) {
    const a = alvor(g);
    for (const k of [1, 2, 3] as Klasse[]) {
        const kl = TUNING.klasser[k];
        if (g.t < kl.åpner || g.t < g.nesteGruppe[k] || g.igjen[k] <= 0) continue;
        const f = fase(k, g.t);
        const antall = Math.min(g.igjen[k], Math.round(mellom(g, f.størrelse)));
        g.igjen[k] -= antall;
        g.grupper.push({
            id: g.nesteId++,
            klasse: k,
            antall,
            pos: 0,
            gang: mellom(g, kl.gang),
            iKø: false,
        });
        const tregere = (TUNING.alvorKlasser as readonly number[]).includes(k) ? a : 1;
        g.nesteGruppe[k] = g.t + mellom(g, f.intervall) / tregere;
    }
}

function gå(g: Game, dt: number) {
    const port = TUNING.port.pos;
    const st = TUNING.stuert;
    // Stuerten er fram: porten glir opp en stund.
    if (g.stuertSendt !== null && !g.stuertGjort && g.t >= g.stuertSendt + st.ned) {
        g.stuertGjort = true;
        g.portLukkes = g.t + st.portÅpen;
    }
    // Porten: åpen mens stuerten holder den, og for godt når den åpner seg av seg selv (sent).
    const åpen = portFast(g) || g.t < g.portLukkes;
    if (åpen !== g.portÅpen) {
        g.portÅpen = åpen;
        g.portEndret = g.t;
        if (åpen) g.portFørst ??= g.t;
        g.hendelser.push({
            t: g.t,
            slag: 'port',
            tekst: !åpen ? 'stengt' : portFast(g) && g.t >= g.portLukkes ? 'selv' : 'stuert',
        });
    }
    for (const gr of g.grupper) {
        gr.pos += dt / gr.gang;
        // Gitterporten for tredje klasse: de samler seg bak den til den åpnes.
        if (gr.klasse === 3 && !g.portÅpen && gr.pos > port) gr.pos = port;
        if (gr.pos >= 1) {
            gr.pos = 1;
            gr.iKø = true;
            g.kø.push(gr);
            g.hendelser.push({ t: g.t, slag: 'ankommer' });
        }
    }
    g.grupper = g.grupper.filter((gr) => !gr.iKø);
}

/** Neste båt på hver side svinger ut når daviten er ledig og båten er klar. */
function davitene(g: Game) {
    for (const side of SIDER) {
        if (g.davit[side] !== null || g.t < g.svingTil[side]) continue;
        const neste = g.båter.find((b) => b.side === side && b.tilstand === 'venter');
        if (!neste || g.t < neste.klar) continue;
        neste.tilstand = 'henger';
        g.davit[side] = neste.nr;
        g.hendelser.push({ t: g.t, slag: 'sving', side, båt: neste.nr });
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
        g.hendelser.push({ t: g.t, slag: 'nede', side: b.side, båt: b.nr });
    }
}

function frister(g: Game) {
    for (const b of g.båter) {
        if (b.tilstand === 'nede' || b.tilstand === 'tapt') continue;
        const f = frist(b);
        if (g.t < f.t) continue;
        // Lunta har brent ned: båten og plassene i den er borte. Runden går videre.
        // Båter som aldri rakk å svinge ut, er også borte.
        const hang = b.tilstand !== 'venter';
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
        if (hang)
            g.hendelser.push({ t: g.t, slag: 'tapt', tekst: b.navn, side: b.side, båt: b.nr });
    }
}

/** Natta er over: alle båtene er nede eller tapt, eller klokka har passert 02.20. */
function slutt(g: Game) {
    g.mode = brukt(g) > TUNING.seier ? 'won' : 'lost';
    if (g.mode === 'lost') g.årsak = tomme(g) >= taptePlasser(g) ? 'tomme' : 'tapt';
    g.hendelser.push({ t: g.t, slag: g.mode === 'won' ? 'vunnet' : 'tapt' });
}

/** Fasen i natta følger klokka. */
function brettet(g: Game) {
    let br = 0;
    BRETT.forEach((x, i) => {
        if (g.t >= x.start) br = i;
    });
    if (br !== g.brett) {
        g.brett = br;
        g.hendelser.push({ t: g.t, slag: 'brett', tekst: BRETT[br].banner });
    }
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
    brettet(g);
    nyeGrupper(g);
    gå(g, dt);
    davitene(g);
    gåOmBord(g, dt);
    firing(g, dt);
    frister(g);
    if (g.båter.every((b) => b.tilstand === 'nede' || b.tilstand === 'tapt')) slutt(g);
    if (g.mode === 'play' && g.t >= TUNING.slutt) slutt(g);
    if (g.hendelser.length > 80) g.hendelser.splice(0, g.hendelser.length - 80);
}
