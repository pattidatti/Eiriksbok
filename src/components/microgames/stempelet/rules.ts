// Fagkjernen: stempelet, båndet og kassa.
// 1. Båndet krymper. Tomt bånd = personen er papirløs igjen (passet var aldri et statsborgerskap).
// 2. Stempelet fyller båndet helt (ingen timing: ferdigheten er hvem du tar først).
// 3. Kassa (fra 1932): mynt +1, tom lomme -2, grå sak -3, frimerkeark +4. Husleie ved nyttår.

import { BRETT, FRIMERKE_PLASS, PLASSER } from './levels';
import { type Game, type Pass } from './state';
import { TUNING } from './tuning';

const S = TUNING.stempel;

/** Passet eller arket under et punkt på bordet. */
export function under(g: Game, x: number, z: number): Pass | 'frimerke' | null {
    let best: Pass | null = null;
    let bestD = Infinity;
    for (const p of g.pass) {
        const pl = PLASSER[p.plass];
        const dx = Math.abs(x - pl.x);
        const dz = Math.abs(z - pl.z);
        if (dx > S.treffX || dz > S.treffZ) continue;
        const d = dx + dz;
        if (d < bestD) {
            bestD = d;
            best = p;
        }
    }
    if (best) return best;
    if (
        g.frimerke &&
        Math.abs(x - FRIMERKE_PLASS.x) < S.treffX &&
        Math.abs(z - FRIMERKE_PLASS.z) < S.treffZ
    )
        return 'frimerke';
    return null;
}

/** Hva et slag på passet koster (negativt) eller gir (positivt). 1931 har ingen penger. */
export function pris(g: Game, p: Pass): number {
    if (!BRETT[g.brett].penger) return 0;
    if (p.grå) return -TUNING.kasse.gråSak;
    if (p.lomme === 'mynt') return TUNING.kasse.mynt;
    return -TUNING.kasse.tomLomme;
}

/** Kan passet stemples nå? Gyldige pass (ingen lomme) og pass kassa ikke har råd til, kan ikke. */
export function kanStemple(g: Game, p: Pass): boolean {
    if (!p.lomme && !p.grå) return false;
    return g.kasse + pris(g, p) >= 0;
}

/** Slaget treffer bordet. Hvert slag er fullt (timingringen er tatt bort). */
export function slå(g: Game) {
    const st = g.stempel;
    const mål = under(g, st.x, st.z);
    const fullt = true;
    if (!mål) {
        g.ut.push({ type: 'bom' });
        return;
    }
    if (mål === 'frimerke') {
        g.kasse += TUNING.kasse.frimerke;
        g.frimerke = null;
        g.ut.push({ type: 'frimerke' });
        return;
    }
    const p = mål;
    if (!p.lomme && !p.grå) {
        g.ut.push({ type: 'gyldig', id: p.id });
        return;
    }
    if (!kanStemple(g, p)) {
        g.ut.push({ type: 'tomKasse', id: p.id });
        return;
    }
    const lomme = p.grå ? 'tom' : (p.lomme ?? 'tom');
    const varGrå = p.grå;
    const beløp = pris(g, p);
    const redning = !p.grå && p.igjen < TUNING.redning.igjen;
    g.kasse += beløp;
    p.igjen = p.varer;
    p.lomme = null;
    p.grå = false;
    p.rist = 0;
    p.fornyet++;
    p.merker.push(fullt);
    p.merkeÅr.push(BRETT[g.brett].år);
    g.saker++;
    g.rekke = fullt ? g.rekke + 1 : 0;
    g.lengsteRekke = Math.max(g.lengsteRekke, g.rekke);
    g.ut.push({ type: 'slag', id: p.id, fullt, lomme, grå: varGrå, pris: beløp, redning });
}

/** Personen reiser videre med gyldig pass. Tre fornyelser = arkivkortet. */
export function reis(g: Game, p: Pass) {
    g.pass.splice(g.pass.indexOf(p), 1);
    g.hjulpet++;
    g.ut.push({ type: 'reist', id: p.id, plass: p.plass, person: p.person });
    if (p.fornyet >= 3 && p.person < 10 && !g.arkiv.includes(p.person)) {
        g.arkiv.push(p.person);
        g.ut.push({ type: 'arkiv', person: p.person });
    }
}

/** Passet er til fornyelse: lomma vises (mynt om personen kan betale, ellers tom). */
export function blirTilFornyelse(g: Game, p: Pass) {
    p.lomme = p.betaler ? 'mynt' : 'tom';
    g.valg++;
    g.ut.push({ type: 'forny', id: p.id, lomme: p.lomme });
}

/**
 * Kan den nye personen betale? Årets andel tomme lommer fordeles jevnt (en teller, ikke
 * terningkast), så to runder får omtrent like mange tomme lommer.
 */
export function trekkBetaler(g: Game, p: Pass, tomAndel: number) {
    g.tomTeller += tomAndel;
    let tom = g.tomTeller >= 1;
    // Brett 2: det første passet med tom lomme kommer alene og tidlig.
    if (g.brett === 1 && !g.førsteTom) tom = true;
    if (tom) {
        g.førsteTom = true;
        g.tomTeller = Math.max(0, g.tomTeller - 1);
    }
    p.betaler = !tom;
}
