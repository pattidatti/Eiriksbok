// Tingene i gata: hindringer (hopp eller dukk) og avisark (risiko for poeng), og treff mot dem.

import { nesteTopp, påØy } from './crowd';
import { BRETT, type HType } from './levels';
import type { Game } from './state';
import { TUNING } from './tuning';

const HI = TUNING.hindring;
const HE = TUNING.hender;
const FRI = TUNING.fri;

/** Brettet stolen er i når den når en hindring som legges ut nå. */
function brettVed(g: Game, marsj: number) {
    const t = g.t + HI.foran / marsj;
    let i = 0;
    while (i + 1 < BRETT.length && t >= BRETT[i + 1].fra) i++;
    return BRETT[i];
}

function typer(g: Game, marsj: number): HType[] {
    if (!g.fri) return brettVed(g, marsj).typer;
    if (g.friNr < 2) return ['kjerre', 'lav'];
    if (g.friNr < 4) return ['lav', 'middels'];
    return ['lav', 'middels', 'tråd'];
}

function hver(g: Game): number {
    if (!g.fri) return BRETT[g.brett].hindringHver;
    return Math.max(FRI.hindringMin, FRI.hindringStart - FRI.hindringKrymp * g.friNr);
}

const TOPP: Record<HType, number> = {
    kjerre: HI.kjerre,
    lav: HI.lav,
    middels: HI.middels,
    tråd: 0,
};

/** Legg ut neste hindring (og et avisark før den) foran stolen. */
export function nyeTing(g: Game, marsj: number) {
    if (g.t < g.nesteHindring) return;
    const L = HE.bølgelengde;
    const ts = typer(g, marsj);
    let type = ts[Math.floor(g.rng() * ts.length)];
    // Litt variasjon i avstanden: en bølge fram eller tilbake.
    const topp0 = nesteTopp(g.x + HI.foran + Math.floor(g.rng() * 3 - 1) * L);
    const x = topp0 + HI.fase * L;
    // Før dommen: mellom kongens øyer synker stolen, så der står bare lave kjerrer.
    if (g.vern && !(påØy(g, x - HI.øyMargin) && påØy(g, x + HI.øyMargin))) type = 'kjerre';
    g.hindringer.push({ x, type, topp: TOPP[type], bunn: HI.trådBunn, forbi: false });
    g.valg++;
    if (g.fri || BRETT[g.brett].ark) {
        // Der et vanlig kast fra toppen før når høyest.
        const K = (2 * Math.PI) / L;
        const vy = marsj * g.amp * K * TUNING.fysikk.kast;
        const apex = (vy * vy) / (2 * TUNING.fysikk.tyngde);
        const xa = (marsj * vy) / TUNING.fysikk.tyngde;
        const topp = topp0 - L;
        g.ark.push({ x: topp + xa, y: g.base + g.amp + apex * HI.arkAndel + 0.45, tatt: false });
        g.valg++;
    }
    g.nesteHindring = g.t + hver(g) * (1 - HI.spredning + 2 * HI.spredning * g.rng());
}

/** Sjekk stolen mot hindringer og avisark. 'krasj' = runden er tapt. */
export function kollisjoner(g: Game): 'krasj' | null {
    const halv = HI.bredde / 2;
    for (const o of g.hindringer) {
        if (o.forbi) continue;
        if (g.x > o.x + halv) {
            o.forbi = true;
            continue;
        }
        if (g.x < o.x - halv) continue;
        if (o.type === 'tråd') {
            if (g.y + TUNING.fysikk.stolHøyde > o.bunn) return 'krasj';
        } else if (g.y < o.topp) return 'krasj';
    }
    for (const a of g.ark) {
        if (a.tatt) continue;
        if (Math.hypot(g.x - a.x, g.y + 0.45 - a.y) < HI.arkRadius) {
            a.tatt = true;
            g.arkTatt++;
            g.poeng += TUNING.poeng.avisark * g.mult;
            g.ut.push({ type: 'ark' });
        }
    }
    if (g.hindringer.length > 12) g.hindringer = g.hindringer.filter((o) => o.x > g.x - 30);
    if (g.ark.length > 12) g.ark = g.ark.filter((a) => a.x > g.x - 30);
    return null;
}
