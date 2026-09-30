import type { Rng } from '../sim';
import {
    aktiv,
    begynn,
    kanVelge,
    lapper,
    odds,
    spar,
    stillePazzi,
    trekkUt,
    utsendingHer,
    velgKort,
    GAVE_S,
    LAPP_PRIS,
    MIN_LAPPER,
    MÅ_HA,
    RENTE_TAK,
    PAZZI_STILLE_S,
    tapPris,
    type G,
} from './game';

// Selvspill-robotene for Loddposen. De bruker de samme grepene som eleven (begynn,
// trekkUt, velgKort, spar) og ser bare det eleven ser: hvem som ser bort, hvem som
// kremter, hvor lenge siden Pazzi snudde seg, kista og sjansen ved posen.

export type BotStyle = 'seende' | 'halvgod' | 'ødeland' | 'tilfeldig';

/** Så lenge en elev trenger for å lese kortene. */
const LESETID = 1.2;

const pazzi = (g: G) => g.rådsherrer.find((r) => stillePazzi(g, r) && aktiv(r));

/**
 * Er det trygt å stikke hånda i posen nå? `stilleInn`: hvor sent i Pazzis stille bortblikk man
 * tør. `serHodet`: skiller Albizzis falske kremt (hodet snur seg ikke) fra ekte.
 */
function trygt(g: G, pazziVent: number, stilleInn: number, serHodet: boolean) {
    return g.rådsherrer.every((r) => {
        if (!aktiv(r)) return true;
        if (serHodet && r.blikk === 'varsel' && r.falsk) return true;
        if (r.blikk !== 'bort') return false;
        if (stillePazzi(g, r)) return r.siden < stilleInn;
        // Før 1478 later Pazzi som han ser bort og snur seg tilbake - vent litt.
        if (r.slag === 'pazzi' && r.siden < pazziVent) return false;
        return true;
    });
}

const truet = (g: G, serHodet: boolean) =>
    g.rådsherrer.some((r) => aktiv(r) && r.blikk !== 'bort' && !(serHodet && r.falsk));

/** Gull som må ligge igjen i kista etter en gave: et tap og fire lapper. */
const reserve = (g: G) => tapPris(g) + 4 * LAPP_PRIS;

function kortvalg(g: G, style: BotStyle) {
    const k = g.kort;
    if (!k) return false;
    if (style === 'ødeland') {
        // Kjøper alltid det dyreste kortet den har råd til - uten å tenke på kista.
        if (velgKort(g, 'maleri')) return true;
        return velgKort(g, 'bestikk');
    }
    const aktive = g.rådsherrer.filter(aktiv).length;
    if (style === 'halvgod') {
        // Bestikker bare når kista tåler et tap etterpå.
        if (g.kiste - k.bestikk >= tapPris(g) + 40) return velgKort(g, 'bestikk');
        return false;
    }
    // Vinneren: maleri når bordet er fullt av blikk (to trekninger med én fiende mindre),
    // ellers bestikkelse. Aldri så kista ikke tåler en tapt trekning.
    const res = reserve(g);
    const malVerdt = aktive >= MALERI_FRA_AKTIVE && k.mål !== null;
    if (malVerdt && kanVelge(g, 'maleri') && g.kiste - k.maleri >= res) return velgKort(g, 'maleri');
    if (kanVelge(g, 'bestikk') && g.kiste - k.bestikk >= res) return velgKort(g, 'bestikk');
    spar(g);
    return true;
}

/** Vinneren kjøper maleri når så mange blikk er ved bordet. */
const MALERI_FRA_AKTIVE = 4;

export function botTick(g: G, style: BotStyle, rng: Rng, tick: number) {
    if (g.ended || g.fase === 'trekning') return;
    if (style === 'tilfeldig') return tilfeldigTick(g, rng);
    // Den middels gode er treg: ser på bordet bare annethvert øyeblikk.
    if (style === 'halvgod' && tick % 2 !== 0) return;
    // Gavefasen: bare gavekortet, og først når kortet er lest (som en elev).
    if (g.fase === 'gave') {
        if (GAVE_S - g.faseT < LESETID) return;
        if (!kortvalg(g, style)) spar(g);
        return;
    }

    const halv = style === 'halvgod';
    const ødeland = style === 'ødeland';
    const seende = style === 'seende';
    const o = odds(g.venner, g.fiender);
    // Gull som skal ligge igjen i kista: vinneren tåler ett tap, den middels gode et halvt.
    // Har kista ikke råd til et tap uansett, må trekningen vinnes: da gjelder ingen reserve.
    const tap = tapPris(g);
    // Mens pavens utsending følger med, koster en lapp bare 5: vinneren tør mer da.
    const pave = utsendingHer(g) && seende ? tap / 3 : 0;
    const res = ødeland || g.kiste < tap ? 0 : halv ? tap * 0.8 : tap - pave;
    const p = pazzi(g);
    const kanFiske = g.fiender > 0 && lapper(g) > MIN_LAPPER;

    if (g.hånd.act) {
        // Kremt = ut. Stille Pazzi: ut før blikket hans når posen.
        const pazziSnart = p && p.siden >= PAZZI_STILLE_S - (halv ? 0.7 : 0.25);
        if (truet(g, !halv) || pazziSnart) return void trekkUt(g);
        if (g.hånd.act === 'slipp') {
            // Forsiktig: ut etter to lapper, og fornøyd med god nok sjanse.
            if (halv && (g.hånd.dukk >= 3 || o >= 0.9)) return void trekkUt(g);
            if (g.kiste - LAPP_PRIS < res) return void trekkUt(g);
            // Vinneren vet at banken ikke betaler renter for mer enn seks venner.
            if (seende && g.venner >= MÅ_HA - 1 + RENTE_TAK && g.kiste < 300) return void trekkUt(g);
        } else if (!kanFiske || g.fiender <= 2) trekkUt(g);
        return;
    }

    if (!trygt(g, halv ? 0.2 : 0.35, PAZZI_STILLE_S - (halv ? 1.3 : 0.8), !halv)) return;
    if (halv && o >= 0.9) return;

    if (seende && g.fiender > 2 && kanFiske) {
        begynn(g, 'fisk');
        return;
    }
    const mett = seende && g.venner >= MÅ_HA - 1 + RENTE_TAK && g.kiste < 300;
    if (g.kiste - LAPP_PRIS >= res && !mett) begynn(g, 'slipp');
    else if (seende && kanFiske) begynn(g, 'fisk');
}

function tilfeldigTick(g: G, rng: Rng) {
    const r = rng();
    if (g.kort && (g.fase === 'gave' || rng() < 0.15)) {
        if (rng() < 0.3) spar(g);
        else velgKort(g, rng() < 0.5 ? 'bestikk' : 'maleri');
        return;
    }
    if (g.fase !== 'smugle') return;
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
            'Grådig: fisker fiendene ned til to, holder så hånda i posen til et ekte kremt (ser at Albizzis falske kremt ikke snur hodet, og drar ut før Pazzis tredje rykk fra 1478), sparer til ett tap, kjøper maleri når bordet er fullt av blikk og bestikker ellers, og tør mer mens pavens utsending betaler.',
        style: 'seende',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Forsiktig og treg: ser på bordet bare annethvert øyeblikk, drar hånda ut ved hvert kremt (også de falske) og etter to lapper, fisker aldri, bestikker bare med full kiste og nøyer seg med dårligere sjanse.',
        style: 'halvgod',
    },
    ødeland: {
        forventer: 'taper',
        beskrivelse:
            'Smugler like flinkt som vinneren, men ignorerer kista: kjøper alltid det dyreste kortet og bruker hver florin på lapper uten å spare til en tapt trekning.',
        style: 'ødeland',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Stikker hånda i posen, drar den ut og velger kort helt tilfeldig.',
        style: 'tilfeldig',
    },
};
