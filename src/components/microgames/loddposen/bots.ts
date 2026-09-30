import type { Rng } from '../sim';
import {
    aktiv,
    begynn,
    farligst,
    gi,
    lapper,
    odds,
    spar,
    stillePazzi,
    trekkUt,
    velgKunst,
    LAPP_PRIS,
    MIN_LAPPER,
    PAZZI_STILLE_S,
    tapPris,
    type G,
} from './game';

// Selvspill-robotene for Loddposen. De bruker de samme grepene som eleven (begynn,
// trekkUt, velgKunst, gi, spar) og ser bare det eleven ser: hvem som ser bort, hvem som
// kremter, hvor lenge siden Pazzi snudde seg, kista og sjansen ved posen.

export type BotStyle = 'seende' | 'halvgod' | 'ødeland' | 'tilfeldig';

const pazzi = (g: G) => g.rådsherrer.find((r) => stillePazzi(g, r) && aktiv(r));

/** Er det trygt å stikke hånda i posen nå? `stilleInn`: hvor sent i Pazzis stille bortblikk man tør. */
function trygt(g: G, pazziVent: number, stilleInn: number) {
    return g.rådsherrer.every((r) => {
        if (!aktiv(r)) return true;
        if (r.blikk !== 'bort') return false;
        if (stillePazzi(g, r)) return r.siden < stilleInn;
        // Før 1478 later Pazzi som han ser bort og snur seg tilbake - vent litt.
        if (r.slag === 'pazzi' && r.siden < pazziVent) return false;
        return true;
    });
}

const truet = (g: G) => g.rådsherrer.some((r) => aktiv(r) && r.blikk !== 'bort');

/** Gull som må ligge igjen i kista i tilfelle trekningen går tapt. */
const reserve = (g: G) => tapPris(g) + LAPP_PRIS;

function kunstvalg(g: G, style: BotStyle) {
    const k = g.kort;
    if (!k) return false;
    if (k.valgt) {
        const r = farligst(g);
        if (r) gi(g, r.id);
        else spar(g);
        return true;
    }
    if (style === 'ødeland') {
        // Kjøper alltid det dyreste den har råd til - uten å tenke på kista.
        if (g.kiste >= k.valg[1].pris) return velgKunst(g, 1);
        if (g.kiste >= k.valg[0].pris) return velgKunst(g, 0);
        return false;
    }
    const aktive = g.rådsherrer.filter(aktiv).length;
    if (style === 'halvgod') {
        // Kjøper det billige verket bare når kista er god og bordet er fullt.
        if (aktive >= 5 && g.kiste - k.valg[0].pris >= 200) return velgKunst(g, 0);
        return false;
    }
    // Kunst når bordet er fullt av blikk, men aldri så kista ikke tåler en tapt trekning.
    const res = reserve(g);
    const råd = ([0, 1] as const).filter((i) => g.kiste - k.valg[i].pris >= res);
    råd.sort((a, b) => k.valg[b].trekninger / k.valg[b].pris - k.valg[a].trekninger / k.valg[a].pris);
    if (råd.length) return velgKunst(g, råd[0]);
    spar(g);
    return true;
}

export function botTick(g: G, style: BotStyle, rng: Rng, tick: number) {
    if (g.ended || g.fase !== 'smugle') return;
    if (style === 'tilfeldig') return tilfeldigTick(g, rng);
    // Den middels gode er treg: ser på bordet bare annethvert øyeblikk.
    if (style === 'halvgod' && tick % 2 !== 0) return;

    const halv = style === 'halvgod';
    const ødeland = style === 'ødeland';
    const seende = style === 'seende';
    const o = odds(g.venner, g.fiender);
    // Gull som skal ligge igjen i kista: vinneren tåler ett tap, den middels gode et halvt.
    const res = ødeland ? 0 : halv ? tapPris(g) / 2 : tapPris(g);
    const p = pazzi(g);
    const kanFiske = g.fiender > 0 && lapper(g) > MIN_LAPPER;

    if (g.hånd.act) {
        // Kremt = ut. Stille Pazzi: ut før blikket hans når posen.
        const pazziSnart = p && p.siden >= PAZZI_STILLE_S - (halv ? 0.7 : 0.25);
        if (truet(g) || pazziSnart) return void trekkUt(g);
        if (g.hånd.act === 'slipp') {
            // Forsiktig: ut etter to lapper, og fornøyd med god nok sjanse.
            if (halv && (g.hånd.dukk >= 2 || o >= 0.8)) return void trekkUt(g);
            if (g.kiste - LAPP_PRIS < res) return void trekkUt(g);
            // Vinneren fisker ut fiendene før den blir grådig.
            if (seende && g.fiender > 2 && kanFiske) return void trekkUt(g);
        } else if (!kanFiske || g.fiender <= 2) trekkUt(g);
        return;
    }

    if (kunstvalg(g, style)) return;

    if (!trygt(g, halv ? 0.2 : 0.35, PAZZI_STILLE_S - (halv ? 1.3 : 0.8))) return;
    if (halv && o >= 0.8) return;

    if (seende && g.fiender > 2 && kanFiske) {
        begynn(g, 'fisk');
        return;
    }
    if (g.kiste - LAPP_PRIS >= res) begynn(g, 'slipp');
    else if (seende && kanFiske) begynn(g, 'fisk');
}

function tilfeldigTick(g: G, rng: Rng) {
    const r = rng();
    if (g.kort && rng() < 0.15) {
        if (g.kort.valgt) {
            const liste = g.rådsherrer;
            gi(g, liste[Math.floor(rng() * liste.length)].id);
        } else if (rng() < 0.3) spar(g);
        else velgKunst(g, rng() < 0.5 ? 0 : 1);
        return;
    }
    if (r < 0.2) begynn(g, 'slipp');
    else if (r < 0.28) begynn(g, 'fisk');
    else if (r < 0.45) trekkUt(g);
}

export const BOTS: Record<
    string,
    { forventer: 'vinner' | 'taper' | 'middels'; tilfeldig?: boolean; beskrivelse: string; style: BotStyle }
> = {
    seende: {
        forventer: 'vinner',
        beskrivelse:
            'Grådig: fisker fiendene ned til to, holder så hånda i posen til kremtet (og før Pazzis stille blikk fra 1478), sparer til ett tap og kjøper kunst til den farligste rådsherren.',
        style: 'seende',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Forsiktig og treg: ser på bordet bare annethvert øyeblikk, drar hånda ut etter to lapper (ingen multiplikator), fisker aldri og nøyer seg med dårligere sjanse.',
        style: 'halvgod',
    },
    ødeland: {
        forventer: 'taper',
        beskrivelse:
            'Smugler like flinkt som vinneren, men ignorerer kista: kjøper alltid det dyreste kunstverket og bruker hver florin på lapper uten å spare til en tapt trekning.',
        style: 'ødeland',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Stikker hånda i posen, drar den ut og kjøper kunst helt tilfeldig.',
        style: 'tilfeldig',
    },
};
