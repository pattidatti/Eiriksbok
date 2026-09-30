import type { Rng } from '../sim';
import {
    aktiv,
    begynn,
    farligst,
    gi,
    lønn,
    misunnelig,
    odds,
    spar,
    trekkUt,
    velgKunst,
    LAPP_PRIS,
    MISUNNELSE,
    TREKNINGER,
    type G,
} from './game';

// Selvspill-robotene for Loddposen. De bruker de samme grepene som eleven (begynn,
// trekkUt, velgKunst, gi, spar) og ser bare det eleven ser: hvem som ser bort, hvem som
// kremter, hvor lenge siden Pazzi snudde seg, kista og kulene ved posen.

export type BotStyle = 'seende' | 'halvgod' | 'ødeland' | 'tilfeldig';

/** Er det trygt å stikke hånda i posen nå? */
function trygt(g: G, pazziVent: number) {
    return g.rådsherrer.every((r) => {
        if (!aktiv(r)) return true;
        if (r.blikk !== 'bort') return false;
        // Pazzi later som han ser bort og snur seg tilbake - vent litt etter at han snudde seg.
        if (r.slag === 'pazzi' && r.siden < pazziVent) return false;
        return true;
    });
}

const truet = (g: G) => g.rådsherrer.some((r) => aktiv(r) && r.blikk !== 'bort');

/** Hvor mye gull som må ligge igjen i kista: lønna etter denne trekningen, og en buffer mot 1469. */
function reserve(g: G) {
    const buffer = g.trekning >= 2 && g.trekning < TREKNINGER - 1 ? 60 : 0;
    return lønn(3) + buffer;
}

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
        // Kjøper alltid det dyreste den har råd til - uten å tenke på lønna.
        if (g.kiste >= k.valg[1].pris) return velgKunst(g, 1);
        if (g.kiste >= k.valg[0].pris) return velgKunst(g, 0);
        return false;
    }
    if (style === 'halvgod') {
        // Kjøper bare noe når kista er over misunnelseslinja.
        if (misunnelig(g) && g.kiste - k.valg[0].pris >= lønn(3)) return velgKunst(g, 0);
        return false;
    }
    // Kunst når bordet er fullt av blikk eller kista er misunnelig, men aldri så lønna ryker.
    const aktive = g.rådsherrer.filter(aktiv).length;
    const behov = misunnelig(g) || aktive >= 4 || g.kiste > MISUNNELSE - 60;
    const res = lønn(3) + LAPP_PRIS * 4;
    // Det verket som gir flest beundrer-trekninger per florin, og som kista tåler.
    const råd = ([0, 1] as const).filter((i) => g.kiste - k.valg[i].pris >= res);
    råd.sort((a, b) => k.valg[b].trekninger / k.valg[b].pris - k.valg[a].trekninger / k.valg[a].pris);
    if (behov && råd.length) return velgKunst(g, råd[0]);
    spar(g);
    return true;
}

export function botTick(g: G, style: BotStyle, rng: Rng, tick: number) {
    if (g.ended || g.fase !== 'smugle') return;
    if (style === 'tilfeldig') return tilfeldigTick(g, rng);
    if (style === 'halvgod' && tick % 3 !== 0) return;

    // Hånda i posen og noen kremter: et slipp er raskere enn kremtet, et fiske er det ikke.
    // Pazzi kremter kortere enn de andre, så med ham drar vinneren alltid hånda ut.
    if (g.hånd.act) {
        const pazziKremter = g.rådsherrer.some((r) => aktiv(r) && r.slag === 'pazzi' && r.blikk !== 'bort');
        if (truet(g) && (g.hånd.act === 'fisk' || pazziKremter)) trekkUt(g);
        return;
    }

    if (kunstvalg(g, style)) return;

    const pazziVent = style === 'halvgod' ? 0.2 : 0.35;
    if (!trygt(g, pazziVent)) return;

    const o = odds(g.venner, g.fiender);
    const mål = style === 'halvgod' ? 0.78 : g.trekning < 4 ? 0.88 : 0.93;
    // Ødelanden kjøper venner så lenge det er gull i kista, uansett hvor gode oddsen er.
    if (o >= mål && style !== 'ødeland') return;

    const rå = style === 'ødeland' ? LAPP_PRIS : reserve(g) + LAPP_PRIS;
    const harRåd = g.kiste >= rå;
    // Fisk når gullet er knapt (fisking er gratis, men tar lengre tid).
    if (style !== 'halvgod' && g.fiender > 0 && (!harRåd || (g.fiender >= 4 && rng() < 0.3))) {
        begynn(g, 'fisk');
        return;
    }
    if (harRåd) begynn(g, 'slipp');
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
            'Slipper lapper bare når alle ser bort (og venter litt etter Pazzi), drar hånda ut ved kremtet, holder gull til lønna og kjøper kunst til den farligste rådsherren når kista blir misunnelig.',
        style: 'seende',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger samme regler, men reagerer bare hvert tredje øyeblikk, fisker aldri, stoler for fort på Pazzi og nøyer seg med dårligere odds.',
        style: 'halvgod',
    },
    ødeland: {
        forventer: 'taper',
        beskrivelse:
            'Smugler like flinkt som vinneren, men ignorerer banken: kjøper alltid det dyreste kunstverket og bruker hver florin på lapper uten å spare til lønna.',
        style: 'ødeland',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Stikker hånda i posen, drar den ut og kjøper kunst helt tilfeldig.',
        style: 'tilfeldig',
    },
};
