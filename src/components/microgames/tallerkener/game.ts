// Kjerneløkka i Elleve år: kalender, snurr som dør ut, gull inn og ut av kista, sidene med
// nye tallerkener, parlamentets tinntallerken, seier i 1640 og tap.

import { TUNING } from './tuning';
import { brettFor, BRETT, SLOTS } from './levels';
import { newPlate, type Game, type Plate } from './state';
import {
    aarNa,
    egneStenger,
    fall,
    hoffForbruk,
    inntekt,
    parlamentTilbud,
    settInn,
    skottetrekk,
    spinTap,
} from './rules';

export { newGame } from './state';
export type { Game } from './state';

const S = TUNING.snurr;
const P = TUNING.parlament;

export function update(g: Game, dt: number): void {
    if (g.mode !== 'play') return;
    g.t += dt;
    const aar = aarNa(g);
    const brett = brettFor(aar);

    kalender(g, aar, brett.nr);

    if (aar >= TUNING.protest.fra) protest(g, dt);

    // Snurret dør ut; vaklende tallerkener gir ikke gull, og stopper de, faller de.
    let inn = 0;
    let vaklerFor = 0;
    let nyVakler = false;
    for (const s of g.slots) if (s.plate?.vakler) vaklerFor++;
    for (const s of g.slots) {
        const p = s.plate;
        if (s.state !== 'aktiv' || !p) continue;
        p.spin -= spinTap(g, p) * dt;
        if (p.lett > 0) p.lett -= dt;
        if (p.protestT > 0) p.protestT -= dt;
        if (p.komboT > 0) {
            p.komboT -= dt;
            if (p.komboT <= 0) p.kombo = 1;
        }
        const vakler = p.spin < S.vakle;
        if (vakler && !p.vakler) nyVakler = true;
        p.vakler = vakler;
        if (p.spin <= 0) {
            fall(g, s.id);
            // Brett 1 straffer ikke: en ny tallerken kommer gratis.
            if (brett.gratis) {
                s.state = 'aktiv';
                s.plate = newPlate('skip');
                g.events.push({ type: 'ny', slot: s.id });
            }
            continue;
        }
        const i = inntekt(s);
        s.aarGull += i * dt;
        inn += i;
    }
    // Et ærlig valg: en ny tallerken vakler mens minst én annen allerede vakler (hvem redder du?).
    let vaklerNa = 0;
    for (const s of g.slots) if (s.plate?.vakler) vaklerNa++;
    if (nyVakler && vaklerNa >= 2 && vaklerNa > vaklerFor) g.valg++;
    g.gull += inn * dt;
    g.egetGull += inn * dt;
    g.aarTjent += inn * dt;

    // Ut av kista: hoffet og flåten, skottene i krigen, og hoffkostnaden på alt over taket
    // (en full kiste lønner seg ikke - gull må tjenes hvert år).
    const H = TUNING.kiste.hoff;
    // I krigen går alt til hæren: hoffkostnaden gjelder bare i fredsårene.
    const hoff = g.gull > H.over && aar < TUNING.tid.skottene ? (g.gull - H.over) * H.andel : 0;
    const fast = hoffForbruk(g);
    const skott = skottetrekk(g);
    g.gull -= (fast + skott + hoff) * dt;
    g.hoffTatt += hoff * dt;
    g.skottTatt += skott * dt;
    g.flyt.inn = inn;
    g.flyt.forbruk = fast;
    g.flyt.hoff = hoff;
    g.flyt.skott = skott;
    g.flyt.parlament = g.tin.state === 'oser' ? g.tin.gull / P.oser : 0;

    // Etter 1640 er borgerkrigen en styrt epilog: ingen sider, ingen parlamentsøkter, ingen tap.
    if (brett.sider && !g.won) sider(g, dt, aar);
    if (brett.parlament && !g.won) tinntallerken(g, dt, aar);

    // Seier: 1640 med gull i kista. Så går borgerkrigen fram mot 1649.
    if (!g.won && aar >= TUNING.tid.seier && g.gull > 0) {
        g.won = true;
        g.beholdt1640 = egneStenger(g);
        g.gitt1640 = g.tatt;
        g.page = null;
        if (g.tin.state === 'nede') g.tin.state = 'oppe';
        g.events.push({ type: 'seier' });
    }
    if (g.won) {
        if (g.gull < 0) g.gull = 0;
        // Rettssaken i 1649 får stå et øyeblikk på scenen før teppet går ned.
        if (aar >= TUNING.tid.slutt + 0.7) slutt(g, 'aar1649');
    } else if (
        g.tatt >= P.kroker ||
        !g.slots.some((s) => s.state === 'aktiv' || s.state === 'tom')
    ) {
        slutt(g, 'parlament');
    } else if (g.gull <= 0) {
        g.gull = 0;
        slutt(g, aar < TUNING.tid.skottene ? 'fred' : 'kiste');
    }
}

function slutt(g: Game, cause: Game['cause'] & string) {
    // Tap før 1640 (tom kiste eller alle stengene borte): poengene halveres.
    if (!g.won) g.score *= TUNING.poeng.tap;
    g.mode = 'over';
    g.cause = cause;
    g.events.push({ type: 'slutt' });
}

function kalender(g: Game, aar: number, brett: number) {
    const hele = Math.floor(aar);
    if (hele > g.sistAar) {
        g.sistAar = hele;
        // Årsoppgjøret: gull tjent i år x stenger igjen blir poeng.
        g.sistPoeng = Math.round(g.aarTjent * egneStenger(g));
        g.score += g.sistPoeng;
        g.aarTjent = 0;
        for (const s of g.slots) s.aarGull = 0;
        g.events.push({ type: 'aar', aar: hele });
        // En ny adelstittel er solgt: en ny våpenskjold-tallerken du ikke kan si nei til.
        if ((TUNING.titler as readonly number[]).includes(hele)) {
            const id = tvungen(g, 'vapen', false);
            if (id >= 0) g.events.push({ type: 'tittel-ny', slot: id });
        }
        hendelser(g, hele);
        if (hele === TUNING.tid.skottene) {
            g.events.push({ type: 'storm' });
            // Krigen: tinntallerkenen kommer straks.
            g.tin.neste = Math.min(g.tin.neste, 0.2);
        }
    }
    if (brett > g.sistBrett) {
        g.sistBrett = brett;
        g.events.push({ type: 'brett', nr: brett });
        if (BRETT[brett - 1].parlament && g.tin.state === 'oppe' && brett === 3)
            g.tin.neste = 2;
    }
}

/** En tallerken du ikke kan si nei til, på en ledig stang (bakerst først hvis `bak`). */
function tvungen(g: Game, kind: Plate['kind'], bak: boolean): number {
    const stengt = g.slots.filter((x) => x.state === 'stengt');
    if (bak) stengt.sort((a, b) => SLOTS[b.id].dybde - SLOTS[a.id].dybde);
    const ledig = stengt[0] ?? g.slots.find((x) => x.state === 'tom');
    if (!ledig) return -1;
    if (g.page?.slot === ledig.id) g.page = null;
    settInn(g, ledig, kind);
    ledig.plate!.lett = TUNING.snurr.lett;
    return ledig.id;
}

/** Én ny synlig hendelse hvert år i midten, og borgerkrigen etter 1640. */
function hendelser(g: Game, hele: number) {
    const E = TUNING.hendelser;
    if (hele === E.saape) {
        const id = tvungen(g, 'monopol', false);
        g.events.push({ type: 'hendelse', navn: 'saape', slot: id >= 0 ? id : undefined });
    }
    if (hele === E.innland) {
        // Skipsskatten kreves i hele landet: to nye skip-tallerkener langt inne som vakler fort.
        g.innland = true;
        const a = tvungen(g, 'skip', true);
        const b = tvungen(g, 'skip', true);
        for (const id of [a, b]) if (id >= 0) g.slots[id].plate!.fort = E.innlandFort;
        g.events.push({ type: 'hendelse', navn: 'innland', slot: a >= 0 ? a : undefined });
        if (b >= 0) g.events.push({ type: 'ny', slot: b });
    }
    if (hele === E.hampden) {
        // Hampden nekter å betale: skip-tallerkenen lengst inne blir rød og må sveipes to ganger.
        let best: (typeof g.slots)[number] | null = null;
        for (const s of g.slots) {
            const p = s.plate;
            if (s.state !== 'aktiv' || !p || p.kind !== 'skip') continue;
            if (!best || SLOTS[s.id].dybde > SLOTS[best.id].dybde) best = s;
        }
        if (best) {
            const p = best.plate!;
            p.spin = Math.max(0.3, p.spin * TUNING.protest.andel);
            p.hampden = E.hampdenSveip;
            p.protestT = 99;
            g.events.push({ type: 'protest', slot: best.id });
        }
        g.events.push({ type: 'hendelse', navn: 'hampden', slot: best?.id });
    }
    if (hele === E.skotter) g.events.push({ type: 'hendelse', navn: 'skotter' });
    const st = TUNING.borgerkrig.stasjoner as readonly number[];
    const i = st.indexOf(hele);
    if (g.won && i >= 0) {
        const navn = (['borgerkrig', 'nma', 'pride', 'rettssak'] as const)[i];
        g.events.push({ type: 'hendelse', navn });
        // Parlamentets hær tar én stang i 1642, 1645 og 1648 (den rikeste). I 1649 er det
        // rettssaken: da teller stengene du holdt ut krigen.
        const n = navn === 'rettssak' ? 0 : 1;
        for (let k = 0; k < n; k++) {
            const id = parlamentTilbud(g)[0];
            if (id === undefined) break;
            const s = g.slots[id];
            g.taattKind[id] = s.plate?.kind ?? null;
            s.state = 'tatt';
            s.plate = null;
            g.tatt++;
            g.events.push({ type: 'haer', slot: id });
        }
    }
}

/**
 * Protester (Hampden 1637): hvert `hver` s mister tallerkenen som tjener mest, halve snurret
 * og slingrer rødt uten å gi gull en liten stund.
 */
function protest(g: Game, dt: number) {
    g.protestNeste -= dt;
    if (g.protestNeste > 0) return;
    g.protestNeste = TUNING.protest.hver;
    let best: (typeof g.slots)[number] | null = null;
    let mest = -1;
    for (const s of g.slots) {
        if (s.state !== 'aktiv' || !s.plate || s.plate.protestT > 0) continue;
        const v = TUNING.typer[s.plate.kind].gull * (s.plate.spin >= TUNING.snurr.slakk ? 1 : 0.1);
        if (v > mest) {
            mest = v;
            best = s;
        }
    }
    if (!best) return;
    const p = best.plate!;
    p.spin = Math.max(0.05, p.spin * TUNING.protest.andel);
    p.protestT = TUNING.protest.tid;
    g.events.push({ type: 'protest', slot: best.id });
}

/** Sidene bærer inn nye tallerkener til en tom stang. Ta imot, eller la siden gå. */
function sider(g: Game, dt: number, aar: number) {
    const T = TUNING.sider;
    if (g.page) {
        g.page.t -= dt;
        if (g.page.t <= 0) g.page = null;
        return;
    }
    g.pageNeste -= dt;
    if (g.pageNeste > 0) return;
    g.pageNeste = T.hver;
    // Først nye stenger bakover på scenen (skipsskatten flytter inn i landet), så tomme stenger.
    const ny = g.slots.find((s) => s.state === 'stengt');
    const tom = g.slots.find((s) => s.state === 'tom');
    const s = ny ?? tom;
    if (!s) return;
    const forsteVapen = aar >= T.vapenFra && g.titler === 0 && !g.slots.some((x) => x.plate?.kind === 'vapen');
    const r = g.rng();
    const kind =
        aar >= T.vapenFra && (forsteVapen || r < T.vapenSjanse)
            ? 'vapen'
            : r < T.vapenSjanse + T.monopolSjanse
              ? 'monopol'
              : 'skip';
    g.page = { slot: s.id, kind, t: T.venter, pris: s.brukt ? T.erstatt : 0 };
    g.events.push({ type: 'side', slot: s.id });
}

/** Parlamentets tinntallerken senker seg fra taket, og øser gull når den er tatt. */
function tinntallerken(g: Game, dt: number, aar: number) {
    const tin = g.tin;
    if (tin.state === 'oser') {
        g.gull += (tin.gull / P.oser) * dt;
        tin.t -= dt;
        if (tin.t <= 0) {
            tin.state = 'oppe';
            tin.neste = aar >= TUNING.tid.skottene ? P.hverStorm : P.hver;
        }
        return;
    }
    if (tin.state === 'nede') {
        // Tilbudet følger hva du har akkurat nå (de rikeste stengene).
        tin.tilbud = parlamentTilbud(g);
        tin.t -= dt;
        if (tin.t <= 0) {
            tin.state = 'oppe';
            tin.neste = aar >= TUNING.tid.skottene ? P.hverStorm : P.hver;
        }
        return;
    }
    tin.neste -= dt;
    if (tin.neste <= 0) {
        tin.state = 'nede';
        tin.t = P.nede;
        tin.tilbud = parlamentTilbud(g);
        tin.gull =
            aar >= TUNING.tid.skottene ? P.gullStorm : aar >= TUNING.tid.varsel ? P.gullSent : P.gull;
        g.valg++;
        g.events.push({ type: 'tin-ned' });
    }
}

/** 0-1: hvor hardt spillet presser nå (tynn kiste, slakke tallerkener, makt gitt bort). */
export function pressure(g: Game): number {
    const pr = TUNING.press;
    const aktive = g.slots.filter((s) => s.state === 'aktiv' && s.plate);
    const slakke = aktive.filter((s) => s.plate!.spin < S.slakk * 1.6).length;
    const andel = aktive.length ? slakke / aktive.length : 1;
    const sek = g.gull / Math.max(0.1, hoffForbruk(g) + skottetrekk(g));
    const tynn = 1 - Math.min(1, sek / pr.reserveRef);
    // Makt som er gitt bort, er også press: færre stenger igjen å redde kista med.
    const makt = g.tatt / P.kroker;
    return Math.min(1, pr.andelKiste * tynn + pr.andelSlakk * andel + pr.andelMakt * makt);
}
