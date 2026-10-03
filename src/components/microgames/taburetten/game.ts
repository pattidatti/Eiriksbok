// Spillreglene i Taburetten: update, grepene (hold, bytt, fortsett), manuset og frispillet.
// Fagregelen (løftet fra stripa) bor i crowd.ts, tingene i gata i spawn.ts, øyene i øyer.ts.

import { flate, kastOpp, løft, oppdaterHender, påØy, stegStol } from './crowd';
import { BRETT, FRI_FØRSTE, FRI_PASSASJER, MANUS, SVERDRUP, type Farge, type Manus } from './levels';
import { kollisjoner, nyeTing } from './spawn';
import { FLERTALL, SETER, type Banner, type Game, type Årsak } from './state';
import { TUNING } from './tuning';
import { nyeØyer } from './øyer';

export { newGame, type Game } from './state';

const B = TUNING.bytte;
const P = TUNING.poeng;
const FRI = TUNING.fri;

/** Manuset sortert på når hver linje utløses (bannerne vises før de treffer). */
const utløs = (m: Manus) => (m.type === 'banner' ? m.t - TUNING.banner.varsel : m.t);
const MANUS_KØ = [...MANUS].sort((a, b) => utløs(a) - utløs(b));
const SEIER_T = MANUS.find((m) => m.type === 'banner' && m.seier)!.t;

const andre = (f: Farge): Farge => (f === 'rød' ? 'blå' : 'rød');
const flertallI = (rødt: number): Farge => (rødt >= FLERTALL ? 'rød' : 'blå');

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

/** Banneret med en kandidat som kan tas nå (fra perfekt-vinduet før til sent-vinduet etter). */
export function aktivtBanner(g: Game): Banner | null {
    if (g.mode !== 'play') return null;
    for (const b of g.bannere) {
        if (!b.passasjer || b.tatt) continue;
        const d = g.t - b.t;
        if (d >= -g.perfektVindu && d <= B.sentVindu) return b;
    }
    return null;
}

/** Kan eleven bytte nå? */
export function kanBytte(g: Game): boolean {
    return aktivtBanner(g) !== null;
}

/** Bytt: den i setet kastes av, kandidaten fra banneret hopper opp. */
export function bytt(g: Game) {
    const b = aktivtBanner(g);
    if (!b || !b.passasjer) return;
    const ny = b.passasjer;
    const etter = flertallI(b.rødt);
    const gammelHar = g.stol.farge === etter;
    const nyHar = ny.farge === etter;
    const ut = { navn: ny.navn, farge: ny.farge };
    if (nyHar && !gammelHar) {
        if (Math.abs(g.t - b.t) <= g.perfektVindu) {
            g.perfekte++;
            g.perfektRekke++;
            g.mult = Math.min(P.multMaks, g.mult + P.multPerfekt);
            g.poeng += P.perfekt * g.mult * g.perfektRekke;
            kastOpp(g, B.perfektKast);
            g.ut.push({ type: 'perfekt', ...ut });
        } else {
            g.perfektRekke = 0;
            g.ut.push({ type: 'bytte', ...ut });
        }
    } else {
        // Bort fra en som har flertallet bak seg, eller inn med en som ikke har det.
        g.mult = 1;
        g.kombo = 0;
        g.perfektRekke = 0;
        if (!nyHar) g.base = Math.max(0, g.base - TUNING.synk.feilFall);
        g.ut.push({ type: nyHar ? 'unødvendig' : 'feil', ...ut });
    }
    b.tatt = true;
    g.forrige = g.stol;
    g.stol = ny;
    g.sitteTid = 0;
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

function visBanner(
    g: Game,
    tekst: string,
    t: number,
    rødt: number,
    o: Partial<Pick<Banner, 'dom' | 'seier' | 'passasjer'>> = {}
) {
    const før = g.bannere.length ? g.bannere[g.bannere.length - 1].rødt : g.rødt;
    const passasjer = o.passasjer ?? null;
    g.bannere.push({
        t,
        tekst,
        rødt,
        passasjer,
        tatt: false,
        dom: !!o.dom,
        seier: !!o.seier,
        snur: flertallI(rødt) !== flertallI(før),
        vist: true,
        truffet: false,
    });
    g.valg++;
    g.ut.push({
        type: 'banner',
        tekst,
        farge: passasjer?.farge ?? null,
        navn: passasjer?.navn ?? null,
    });
}

function manus(g: Game) {
    while (g.manus < MANUS_KØ.length && g.t >= utløs(MANUS_KØ[g.manus])) {
        const m = MANUS_KØ[g.manus++];
        if (m.type === 'lapp') g.ut.push({ type: 'lapp', nøkkel: m.nøkkel });
        else if (m.type === 'banner')
            visBanner(g, m.tekst, m.t, m.rødt, {
                dom: m.dom,
                seier: m.seier,
                passasjer: m.passasjer,
            });
        else {
            g.nedtelling = { tekst: m.tekst, til: m.til };
            g.ut.push({ type: 'nedtelling', tekst: m.tekst });
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
    const før = g.bannere.length ? g.bannere[g.bannere.length - 1].rødt : g.rødt;
    const vinner = snur ? andre(flertallI(før)) : flertallI(før);
    const margin = Math.max(
        FRI.marginMin,
        Math.round(FRI.marginStart - FRI.marginKrymp * nr - g.rng() * 3)
    );
    const flertall = Math.min(SETER, 57 + margin);
    const rødt = vinner === 'rød' ? flertall : SETER - flertall;
    // Snur valget (eller sitter det en uten flertall), løper flertallets kandidat med banneret.
    // Ellers er kandidaten en felle: samme farge (unødvendig) eller feil farge.
    const trenger = snur || g.stol.farge !== vinner;
    const farge = trenger ? vinner : g.rng() < 0.5 ? vinner : andre(vinner);
    const t = g.t + TUNING.banner.varsel;
    visBanner(g, `Valg nr. ${nr + 2}`, t, rødt, { passasjer: FRI_PASSASJER[farge] });
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
            g.øyer.length = 0;
            // Livgarden løfter stolen en siste gang før den slipper.
            g.base = Math.max(g.base, TUNING.hender.vernHøyde);
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
    g.bannere = g.bannere.filter((b) => !b.truffet || g.t - b.t < B.sentVindu + 1);
}

function tap(g: Game, årsak: Årsak) {
    if (g.mode !== 'play') return;
    g.mode = 'lost';
    g.årsak = årsak;
    g.hold = false;
    g.ut.push({ type: 'tap', årsak });
}

function seier(g: Game, dt: number) {
    if (g.fri || g.t < SEIER_T) return;
    if (g.stol === SVERDRUP && løft(g) === 'flertall') g.seierKlokke += dt;
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
    nyeØyer(g);
    nyeTing(g, marsj(g));
    treffBannere(g);
    oppdaterHender(g, dt);

    const n = TUNING.fysikk.delsteg;
    const x0 = g.x;
    for (let i = 0; i < n && g.mode === 'play'; i++) {
        const l = stegStol(g, dt / n, marsj(g));
        // Uten flertall klapper ingen: multiplikatoren står på x1.
        const bæres = løft(g) !== 'synk';
        if (l?.kvalitet === 'fin') {
            g.fine++;
            g.kombo++;
            g.mult = bæres ? Math.min(P.multMaks, g.mult + P.multFin) : 1;
            g.poeng += P.finLanding * g.mult;
            g.ut.push({ type: 'fin', mult: g.mult });
        } else if (l?.kvalitet === 'dunk') {
            g.dunk++;
            g.kombo = 0;
            g.mult = 1;
            g.ut.push({ type: 'dunk' });
        }
        if (kollisjoner(g) === 'krasj') tap(g, 'hindring');
    }
    const meter = g.x - x0;
    g.meter += meter;
    g.poeng += meter * P.perMeter * g.mult;

    if (g.vern) {
        const nå = påØy(g, g.x);
        if (nå !== g.påØy) g.ut.push({ type: nå ? 'øy' : 'gap' });
        g.påØy = nå;
    }
    g.sitteTid += dt;
    g.lengsteRegjering = Math.max(g.lengsteRegjering, g.sitteTid);
    if (!g.luft && g.y <= TUNING.hender.gate && løft(g) !== 'flertall') tap(g, 'gata');
    seier(g, dt);
}

// ---------- Avlesning (HUD, snapshot) ----------

/** 0-1: hvor hardt spillet presser nå (fart, og hvor nær gata eller hvor trangt flertallet er). */
export function press(g: Game): number {
    const T = TUNING.press;
    const fart = Math.max(0, Math.min(1, (g.vx - T.fartMin) / (T.fartMaks - T.fartMin)));
    const l = løft(g);
    let fare = 0;
    if (l === 'synk' || l === 'mellom')
        fare = 1 - Math.min(1, flate(g, g.x) / TUNING.hender.vernHøyde) * 0.6;
    else if (l === 'vern') fare = 0.3 * Math.min(1, (g.rødt - 57) / 26);
    else {
        const seter = g.stol.farge === 'rød' ? g.rødt : SETER - g.rødt;
        fare = 0.6 * (1 - Math.min(1, (seter - 57) / 26));
    }
    return T.vektFart * fart + T.vektFare * fare;
}

/** 0-1 mot seieren (kampanjen) - frispillet står på 1. */
export function framdrift(g: Game): number {
    if (g.fri || g.mode === 'won') return 1;
    return Math.min(1, g.t / (SEIER_T + B.seierSek));
}

/** Sekunder til seiersbanneret (kampanjen), for målet i HUD-en. */
export function tilSeier(g: Game): number {
    return Math.max(0, SEIER_T - g.t);
}
