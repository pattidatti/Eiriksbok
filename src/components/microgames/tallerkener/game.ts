// Kjerneløkka i Elleve år: kalender, snurr som dør ut, gull inn og ut av kista, sidene med
// nye tallerkener, parlamentets tinntallerken, seier i 1640 og tap.

import { TUNING } from './tuning';
import { brettFor, BRETT } from './levels';
import { newPlate, type Game } from './state';
import { aarNa, egneStenger, fall, forbruk, inntekt, spinTap } from './rules';

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

    g.gull -= forbruk(g) * dt;

    if (brett.sider) sider(g, dt, aar);
    if (brett.parlament) tinntallerken(g, dt, aar);

    // Seier: 1640 med gull i kista. Runden fortsetter som overtid.
    if (!g.won && aar >= TUNING.tid.seier && g.gull > 0) {
        g.won = true;
        g.events.push({ type: 'seier' });
    }
    if (g.tatt >= P.kroker || !g.slots.some((s) => s.state === 'aktiv' || s.state === 'tom')) {
        slutt(g, 'parlament');
    } else if (g.gull <= 0) {
        g.gull = 0;
        slutt(g, 'kiste');
    }
}

function slutt(g: Game, cause: 'kiste' | 'parlament') {
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
        // Årsoppgjøret: gull i kista x stenger igjen blir poeng.
        g.score += Math.max(0, g.gull) * egneStenger(g);
        for (const s of g.slots) s.aarGull = 0;
        g.events.push({ type: 'aar', aar: hele });
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

/** Protester (Hampden 1637): hvert `hver` s får én tilfeldig tallerken et kraftig vakle-dytt. */
function protest(g: Game, dt: number) {
    g.protestNeste -= dt;
    if (g.protestNeste > 0) return;
    g.protestNeste = TUNING.protest.hver;
    const aktive = g.slots.filter((s) => s.state === 'aktiv' && s.plate);
    if (!aktive.length) return;
    const s = aktive[Math.floor(g.rng() * aktive.length)];
    s.plate!.spin = Math.max(0.02, s.plate!.spin - TUNING.protest.dytt);
    g.events.push({ type: 'protest', slot: s.id });
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
        tin.gull =
            aar >= TUNING.tid.skottene ? P.gullStorm : aar >= TUNING.tid.varsel ? P.gullSent : P.gull;
        g.valg++;
        g.events.push({ type: 'tin-ned' });
    }
}

/** 0-1: hvor hardt spillet presser nå (hvor tynn kista er og andelen slakke tallerkener). */
export function pressure(g: Game): number {
    const pr = TUNING.press;
    const aktive = g.slots.filter((s) => s.state === 'aktiv' && s.plate);
    const slakke = aktive.filter((s) => s.plate!.spin < S.slakk * 1.6).length;
    const andel = aktive.length ? slakke / aktive.length : 1;
    const sek = g.gull / Math.max(0.1, forbruk(g));
    const tynn = 1 - Math.min(1, sek / pr.reserveRef);
    return Math.min(1, pr.andelKiste * tynn + (1 - pr.andelKiste) * andel);
}
