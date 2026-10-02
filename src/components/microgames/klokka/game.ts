// Kjerneløkka: update(g, dt) flytter klokka, folkene i trappene, båtene på
// davitene og sjekker fristene. Grepene (vink, hold) står i rules.ts.

import { BRETT, type Side } from './levels';
import { fase, firetid, frist, mellom } from './rules';
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
            g.valg++; // ny gruppe på dekket: babord eller styrbord?
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
        g.valg++; // ny båt: når skal den ned?
    }
}

function firing(g: Game, dt: number) {
    if (!g.hold) return;
    const i = g.davit[g.hold];
    if (i === null) return;
    const b = g.båter[i];
    g.holdT += dt;
    if (g.holdT < TUNING.firing.holdForsinkelse) return;
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
        if (b.tilstand === 'nede' || b.tilstand === 'tapt') continue;
        const f = frist(b);
        if (g.t >= f.t) {
            b.tilstand = 'tapt';
            g.mode = 'lost';
            g.årsak = f.årsak;
            g.tapsBåt = b.navn;
            g.hendelser.push({ t: g.t, slag: 'tapt', tekst: b.navn });
            return;
        }
    }
}

function brettFerdig(g: Game) {
    const mine = g.båter.filter((b) => b.brett === g.brett);
    if (!mine.every((b) => b.tilstand === 'nede')) return;
    g.brett++;
    if (g.brett >= BRETT.length) {
        g.mode = 'won';
        g.hendelser.push({ t: g.t, slag: 'vunnet' });
        return;
    }
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
    firing(g, dt);
    brettFerdig(g);
    if (g.mode === 'play') frister(g);
    if (g.hendelser.length > 60) g.hendelser.splice(0, g.hendelser.length - 60);
}
