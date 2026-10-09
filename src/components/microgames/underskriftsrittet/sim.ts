// Simuleringen av Underskriftsrittet: samme regler og roboter som Underskriftsrittet.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { brettAv, newGame, press, update, type Game } from './game';
import { BRETT } from './levels';
import { TUNING } from './tuning';

export const GAME_ID = 'underskriftsrittet';

export function årsakTekst(g: Game): string | undefined {
    if (g.mode !== 'lost') return undefined;
    const hvor = `${brettAv(g).tittel}, ${g.segl} segl`;
    return g.årsak === 'lys' ? `tatt i lyset (${hvor})` : `vinteren kom (${hvor})`;
}

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: g.poeng,
        framdrift: Math.min(1, g.segl / TUNING.kommisjon.segl),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak: årsakTekst(g),
    };
}

export const MAKS_SEKUNDER = Math.ceil(BRETT.reduce((s, b) => s + b.sekunder, 0)) + 20;

const spec: SimSpec<Game> = {
    id: GAME_ID,
    maksSekunder: MAKS_SEKUNDER,
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
