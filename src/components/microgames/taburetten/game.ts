// Spillreglene i Taburetten: update, grepene (hold, bytt, fortsett) og manuset.
// Fagregelen (løftet fra stripa) bor i crowd.ts, tingene i gata i spawn.ts.

import { flate, kastOpp, løft, oppdaterHender, stegStol } from './crowd';
import {
    BRETT,
    FRI_FØRSTE,
    FRI_PASSASJER,
    MANUS,
    SVERDRUP,
    type Farge,
    type Manus,
} from './levels';
import { kollisjoner, nyeTing } from './spawn';
import { harFlertall, SETER, type Banner, type Game, type Årsak } from './state';
import { TUNING } from './tuning';

export { newGame, type Game } from './state';

const B = TUNING.bytte;
const P = TUNING.poeng;
const FRI = TUNING.fri;

/** Manuset sortert på når hver linje utløses (bannerne vises før de treffer). */
const utløs = (m: Manus) => (m.type === 'banner' ? m.t - TUNING.banner.varsel : m.t);
const MANUS_KØ = [...MANUS].sort((a, b) => utløs(a) - utløs(b));

const andre = (f: Farge): Farge => (f === 'rød' ? 'blå' : 'rød');

/** Farten mengden bærer stolen med nå. */
export function marsj(g: Game): number {
    if (g.fri) return FRI.marsjStart * (1 + FRI.fartPerBanner * g.friNr);
    return BRETT[g.brett].marsj;
}

// ---------- Grepene (samme for eleven og robotene) ----------

/** Hold inne = len deg fram (tung). Slipp = lett. */
export function hold(g: Game, på: boolean) {
    g.hold = på;
}

/** Kan eleven bytte nå? Knappen finnes først når køen vises (brett 3). */
export function kanBytte(g: Game): boolean {
    return g.mode === 'play' && g.køSynlig;
}

/** Banneret som gjør et bytte nå perfekt, om noe. */
function perfektBanner(g: Game, ny: Farge): Banner | null {
    for (const b of g.bannere) {
        if (!(b.snur || b.seier)) continue;
        if (Math.abs(g.t - b.t) > g.perfektVindu) continue;
        const rødEtter = b.rødt;
        const flertallEtter: Farge = rødEtter >= 58 ? 'rød' : 'blå';
        if (flertallEtter === ny) return b;
    }
    return null;
}

/** Bytt passasjer: den i setet kastes av, den i køen hopper opp. */
export function bytt(g: Game) {
    if (!kanBytte(g)) return;
    const gammel = g.stol;
    const ny = g.kø;
    const perfekt = ny ? perfektBanner(g, ny.farge) : null;
    if (perfekt) {
        g.perfekte++;
        g.mult = Math.min(P.multMaks, g.mult + 1);
        g.poeng += P.perfekt * g.mult;
        g.kombo++;
        kastOpp(g, B.perfektKast);
        g.ut.push({ type: 'perfekt' });
    } else if (gammel && harFlertall(g, gammel.farge)) {
        // Bort fra en som har flertallet bak seg: unødvendig.
        g.mult = 1;
        g.kombo = 0;
        g.ut.push({ type: 'unødvendig' });
    } else g.ut.push({ type: 'bytte' });
    if (gammel) g.sisteFarge = gammel.farge;
    g.stol = ny;
    g.kø = null;
    g.køKlar = B.køTid;
    g.sitteTid = 0;
    g.multTid = 0;
    g.sisteBytte = g.t;
}

/** «Fly videre»: frispillet etter seieren. */
export function fortsett(g: Game) {
    if (g.mode !== 'won') return;
    g.mode = 'play';
    g.fri = true;
    g.friNr = 0;
    g.nesteFri = g.t + FRI.intervallStart - TUNING.banner.varsel;
    g.synkFart = TUNING.synk.friStart;
}

// ---------- Manus og frispill ----------

function visBanner(g: Game, tekst: string, t: number, rødt: number, dom = false, seier = false) {
    const før = g.bannere.length ? g.bannere[g.bannere.length - 1].rødt : g.rødt;
    g.bannere.push({
        t,
        tekst,
        rødt,
        dom,
        seier,
        snur: rødt >= 58 !== før >= 58,
        vist: true,
        truffet: false,
    });
    g.valg++;
    g.ut.push({ type: 'banner', tekst });
}

function manus(g: Game) {
    while (g.manus < MANUS_KØ.length && g.t >= utløs(MANUS_KØ[g.manus])) {
        const m = MANUS_KØ[g.manus++];
        if (m.type === 'lapp') g.ut.push({ type: 'lapp', tekst: m.tekst });
        else if (m.type === 'banner') visBanner(g, m.tekst, m.t, m.rødt, m.dom, m.seier);
        else if (m.type === 'nedtelling') {
            g.nedtelling = { tekst: m.tekst, til: m.til };
            g.ut.push({ type: 'nedtelling', tekst: m.tekst });
        } else if (m.type === 'innsett') {
            if (g.stol) {
                g.stol = m.passasjer;
                g.sitteTid = 0;
            }
            g.ut.push({ type: 'lapp', tekst: m.tekst });
        } else if (m.type === 'kø') {
            g.køSynlig = true;
            g.kø = m.passasjer;
            g.ut.push({ type: 'lapp', tekst: m.tekst });
        }
    }
    if (g.nedtelling && g.t >= g.nedtelling.til) g.nedtelling = null;
    for (let i = BRETT.length - 1; i > 0; i--)
        if (g.t >= BRETT[i].fra) {
            g.brett = i;
            break;
        }
}

function friBanner(g: Game) {
    if (g.t < g.nesteFri) return;
    const nr = g.friNr;
    const snur = nr < FRI_FØRSTE.length ? FRI_FØRSTE[nr] : g.rng() < 0.5;
    const nå: Farge = g.rødt >= 58 ? 'rød' : 'blå';
    const vinner = snur ? andre(nå) : nå;
    const margin = Math.max(
        FRI.marginMin,
        Math.round(FRI.marginStart - FRI.marginKrymp * nr - g.rng() * 3)
    );
    const flertall = Math.min(SETER, 57 + margin);
    const rødt = vinner === 'rød' ? flertall : SETER - flertall;
    const t = g.t + TUNING.banner.varsel;
    visBanner(g, `Valg ${nr + 2}: ${rødt} rødt`, t, rødt);
    g.friNr++;
    const intervall = Math.max(FRI.intervallMin, FRI.intervallStart - FRI.intervallKrymp * g.friNr);
    g.nesteFri = t + intervall - TUNING.banner.varsel;
}

function treffBannere(g: Game) {
    for (const b of g.bannere) {
        if (b.truffet || g.t < b.t) continue;
        b.truffet = true;
        g.rødt = b.rødt;
        if (b.dom) {
            g.vern = false;
            g.ut.push({ type: 'dom' });
        }
        if (g.fri) {
            g.synkFart = Math.min(
                TUNING.synk.friMaks,
                TUNING.synk.friStart + TUNING.synk.friPerBanner * g.friNr
            );
            g.perfektVindu = Math.max(B.perfektMin, B.perfektVindu - B.perfektKrymp * g.friNr);
        }
    }
    g.bannere = g.bannere.filter((b) => !b.truffet || g.t - b.t < 3);
}

// ---------- Køen og stolen ----------

function kø(g: Game, dt: number) {
    if (!g.køSynlig) return;
    if (!g.kø) {
        g.køKlar -= dt;
        if (g.køKlar <= 0) {
            // Etter dommen er køen fri: neste er alltid den andre fargen.
            const f = andre(g.stol ? g.stol.farge : g.sisteFarge);
            // I kampanjen er Venstres mann Sverdrup selv.
            g.kø = f === 'rød' && !g.fri ? SVERDRUP : FRI_PASSASJER[f];
            if (!g.stol) {
                g.stol = g.kø;
                g.kø = null;
                g.køKlar = B.køTid;
                g.sitteTid = 0;
            }
        }
    }
    if (!g.stol) {
        g.tomTid += dt;
        if (g.tomTid > B.tomMaks) tap(g, 'tom');
    } else g.tomTid = 0;
}

function tap(g: Game, årsak: Årsak) {
    if (g.mode !== 'play') return;
    g.mode = 'lost';
    g.årsak = årsak;
    g.hold = false;
    g.ut.push({ type: 'tap', årsak });
}

function seier(g: Game, dt: number) {
    if (g.fri) return;
    const banner = MANUS.find((m) => m.type === 'banner' && m.seier);
    if (!banner || g.t < banner.t) return;
    if (g.stol === SVERDRUP && harFlertall(g, 'rød')) g.seierKlokke += dt;
    else g.seierKlokke = 0;
    if (g.seierKlokke >= B.seierSek) {
        g.poeng += P.seier;
        g.mode = 'won';
        g.hold = false;
        g.ut.push({ type: 'seier' });
    }
}

// ---------- Ett tidssteg ----------

export function update(g: Game, dt: number) {
    if (g.mode !== 'play') return;
    g.t += dt;
    if (g.fri) friBanner(g);
    else manus(g);
    nyeTing(g, marsj(g));
    treffBannere(g);
    oppdaterHender(g, dt);

    const n = TUNING.fysikk.delsteg;
    const x0 = g.x;
    for (let i = 0; i < n && g.mode === 'play'; i++) {
        const l = stegStol(g, dt / n, marsj(g));
        if (l?.kvalitet === 'fin') {
            g.fine++;
            g.kombo++;
            g.poeng += P.finLanding * g.mult;
            g.ut.push({ type: 'fin' });
        } else if (l?.kvalitet === 'dunk') {
            g.dunk++;
            g.kombo = 0;
            g.ut.push({ type: 'dunk' });
        }
        const k = kollisjoner(g);
        if (k === 'krasj') tap(g, 'hindring');
    }
    const meter = g.x - x0;
    g.meter += meter;
    g.poeng += meter * P.perMeter * g.mult;

    kø(g, dt);
    if (g.stol) {
        g.sitteTid += dt;
        g.lengsteRegjering = Math.max(g.lengsteRegjering, g.sitteTid);
        g.multTid += dt;
        if (g.multTid >= P.multSek) {
            g.multTid = 0;
            g.mult = Math.min(P.multMaks, g.mult + 1);
        }
    }
    if (!g.luft && g.y <= TUNING.hender.gate && løft(g) !== 'flertall') tap(g, 'gata');
    seier(g, dt);
}

// ---------- Avlesning (HUD, snapshot) ----------

/** 0-1: hvor hardt spillet presser nå (fart og hvor nær gata eller et trangt flertall). */
export function press(g: Game): number {
    const T = TUNING.press;
    const fart = Math.max(0, Math.min(1, (g.vx - T.fartMin) / (T.fartMaks - T.fartMin)));
    const l = løft(g);
    let fare = 0;
    if (l === 'synk' || l === 'tom')
        fare = 1 - Math.min(1, flate(g, g.x) / TUNING.hender.vernHøyde) * 0.6;
    else if (l === 'flertall' && g.stol) {
        const seter = g.stol.farge === 'rød' ? g.rødt : SETER - g.rødt;
        fare = 0.6 * (1 - Math.min(1, (seter - 57) / 26));
    }
    return T.vektFart * fart + T.vektFare * fare;
}

/** 0-1 mot seieren (kampanjen) - frispillet står på 1. */
export function framdrift(g: Game): number {
    if (g.fri || g.mode === 'won') return 1;
    const slutt = MANUS.find((m) => m.type === 'banner' && m.seier)!.t + B.seierSek;
    return Math.min(1, g.t / slutt);
}
