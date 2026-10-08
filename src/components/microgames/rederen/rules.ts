// Fagkjernen og hjelpere som både spillet, robotene og tegningen bruker. Ren TypeScript.
// Regel 1: en båt ved en flokk tar hval. Regel 2: flokken føder sakte - jo færre, jo færre
// unger. Regel 3: nyttår gjør opp - hver båt koster olje (full pris på havet, lite i havna),
// og fra 1929 faller oljeprisen når det kommer for mange fat på en gang.

import type { Båt, Flokk, Game } from './game';
import { TUNING } from './tuning';

const T = TUNING;

const fraTabell = <R extends { fra: number }>(tab: R[], år: number): R => {
    let r = tab[0];
    for (const x of tab) if (år >= x.fra) r = x;
    return r;
};

/** Sekunder i ett år akkurat nå. */
export const årLengde = (år: number) => fraTabell(T.tid.perioder, år).sek;

/** Olje per vanlig båt per år. */
export const vedlikehold = (år: number) => fraTabell(T.økonomi.vedlikehold, år).båt;

/** Stasjonen på land: fast olje per år. */
export const fastKost = (år: number) => fraTabell(T.økonomi.fast, år).kost;

/** Hva én båt koster neste årsskifte: full pris på havet, en liten del i havna, ingenting til salgs. */
export function havnKost(g: Game, b: Båt): number {
    if (b.tilbud) return 0;
    const full = b.kokeri ? T.økonomi.kokeri : vedlikehold(g.år);
    return b.hjemme ? full * T.økonomi.havnAndel : full;
}

/** Hva hele selskapet koster neste årsskifte: stasjonen pluss båtene. */
export function årsKost(g: Game): number {
    let k = fastKost(g.år);
    for (const b of g.båter) k += havnKost(g, b);
    return k;
}

/** Båtene du eier (ikke de som står til salgs). */
export const egne = (g: Game) => g.båter.filter((b) => !b.tilbud);

export const dist = (ax: number, ay: number, bx: number, by: number) =>
    Math.hypot(ax - bx, ay - by);

/** Ligger båten i ro (fremme)? */
export const iRo = (b: Båt) => dist(b.x, b.y, b.tx, b.ty) < 0.5;

/** Ligger båten i havna (eller er på vei dit)? */
export const iHavn = (_g: Game, b: Båt) => b.hjemme;

/** Flokken båten fanger fra nå (nærmeste levende innenfor radius), eller null. */
export function fangerFra(g: Game, b: Båt): Flokk | null {
    if (b.kokeri || b.tilbud || !iRo(b) || iHavn(g, b) || kvoteFull(g)) return null;
    let best: Flokk | null = null;
    let bd = T.fangst.radius;
    for (const f of g.flokker) {
        if (f.død || f.fredet) continue;
        const d = dist(b.x, b.y, f.x, f.y);
        if (d <= bd) {
            bd = d;
            best = f;
        }
    }
    return best;
}

/** Fødsler per sekund i flokken nå (regel 2). */
export const fødselsrate = (f: Flokk) =>
    f.død || f.n >= f.maks ? 0 : f.n * T.fødsel.perHvalPerSek * T.arter[f.art].fødsel;

/** IWC-kvoten gjelder (fra 1946). */
export const kvoteÅpen = (g: Game) => g.år >= T.kvote.fra;

/** IWC-kvoten (fra 1946): er årets kvote tatt? Da stanser båtene til nyttår. */
export const kvoteFull = (g: Game) => g.år >= T.kvote.fra && g.tattIÅr >= T.kvote.perÅr;

/** Fangst per sekund fra én båt (regel 1). */
export const fangstrate = () => 1 / T.fangst.intervall;

/** Hval i havet du fanger i nå. */
export const hvalIHavet = (g: Game) => g.flokker.reduce((s, f) => s + (f.død ? 0 : f.n), 0);

/** Flokkens sløyfe: posisjonen ved en gitt fase. */
export function sløyfe(f: Flokk, fase: number, t: number) {
    const st = TUNING.vandring;
    return {
        x: f.cx + f.rx * Math.cos(fase) + st.støyPx * Math.sin(t * st.støyFart + f.id * 1.7),
        y: f.cy + f.ry * Math.sin(fase) + st.støyPx * Math.cos(t * st.støyFart * 0.8 + f.id),
    };
}

/** Vinkelfart langs sløyfa (rad/s). */
export const vinkelfart = (f: Flokk) => f.fart / ((f.rx + f.ry) / 2);

/** Hvor er flokken om `sek` sekunder? (Det eleven ser: den glir jevnt langs sløyfa.) */
export const framtid = (f: Flokk, t: number, sek: number) =>
    sløyfe(f, f.fase + vinkelfart(f) * sek, t + sek);

/** Press 0-1: hvor mange båter du må passe på, og hvor fort hvalene vandrer. */
export function press(g: Game): number {
    const båter = g.båter.filter((b) => !b.kokeri && !b.tilbud).length;
    const levende = g.flokker.filter((f) => !f.død);
    const fart = levende.length ? levende.reduce((s, f) => s + f.fart, 0) / levende.length : 0;
    const p = 0.5 * (båter / T.press.maksBåter) + 0.5 * (fart / T.press.maksFart);
    return Math.max(0, Math.min(1, p));
}

/** Framdrift 0-1 mot 1969. */
export const framdrift = (g: Game) =>
    Math.min(1, (g.år - T.tid.start + g.iÅr / årLengde(g.år)) / (T.tid.seier - T.tid.start));

/** Fat som er på vei hjem nå (eleven ser dem rulle). */
export const fatPåVei = (g: Game) => g.fat.length;

/** Oljemarkedet er åpent (fra 1929). */
export const markedÅpent = (g: Game) => g.år >= TUNING.marked.fra;

/** Fat verden kjøper per år (færre i krisa fra 1931). */
export const kjøpPerÅr = (år: number) =>
    år >= TUNING.marked.krise.fra ? TUNING.marked.krise.kjøpPerÅr : TUNING.marked.kjøpPerÅr;

/** Oljeprisen (1 = full) når lageret i verden har så mange fat. */
export function prisFor(lager: number): number {
    const m = TUNING.marked;
    return Math.max(m.bunn, Math.min(1, 1 - m.fall * (lager - m.grense)));
}
