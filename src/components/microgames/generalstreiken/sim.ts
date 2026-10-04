// Simuleringen av Generalstreiken: samme regler og roboter som Generalstreiken.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { update, type Game } from './game';
import { BRETT } from './levels';
import { bølgeFart, fart, millioner, poeng, press } from './rules';
import { newGame } from './state';
import { TUNING } from './tuning';

export const GAME_ID = 'generalstreiken';

/** Lengste mulige runde: alle fristene, bølgen og kortene. */
export const MAKS_SEKUNDER = BRETT.reduce((s, b) => s + b.frist + 45, 0) + 3 * TUNING.kortTid;

const ÅRSAK: Record<NonNullable<Game['årsak']>, string> = {
    bølgen: 'bølgen tok hodet (AVSLUTT for sent)',
    frist: 'fristen gikk ut uten GRENELLE',
    splittet: 'krasjet i egen kjede og ble splittet',
    forLite: 'trykket AVSLUTT under målet',
    stille: 'nådde ikke målet før fristen',
};

export function årsakTekst(g: Game): string | undefined {
    if (g.mode !== 'lost' || !g.årsak) return undefined;
    return `brett ${g.brett.nr}: ${ÅRSAK[g.årsak]}`;
}

export function snapshotOf(
    g: Game | null,
    meny = false
): PlaytestSnapshot & Record<string, unknown> {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    const mål = g.brett.mål;
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: poeng(g),
        framdrift: Math.min(1, (g.bi + Math.min(1, millioner(g) / mål)) / BRETT.length),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak: årsakTekst(g),
        brett: g.brett.nr,
        bølgefart: bølgeFart(g),
        slangefart: fart(g),
    };
}

const spec: SimSpec<Game> = {
    id: GAME_ID,
    maksSekunder: Math.ceil(MAKS_SEKUNDER),
    create: (seed) => newGame(seed),
    step: (g, dt) => {
        update(g, dt);
        g.hendelser.length = 0;
    },
    snapshot: (g) => snapshotOf(g),
    bots: Object.fromEntries(
        Object.entries(BOTS).map(([navn, b]) => [
            navn,
            {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                make: b.make,
            },
        ])
    ),
};

export default spec;
