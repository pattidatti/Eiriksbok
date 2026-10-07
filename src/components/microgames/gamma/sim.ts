// Simuleringen av Gamma: samme regler og roboter som Gamma.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { newGame, update, type Game } from './game';
import { dato } from './levels';
import { dagNå, press } from './rules';
import { TUNING } from './tuning';

export const GAME_ID = 'gamma';

export function årsakTekst(g: Game): string | undefined {
    if (g.mode !== 'lost') return undefined;
    const når = dato(dagNå(g));
    return g.årsak === 'funnet'
        ? `funnet av lyset ${når} (${g.x <= TUNING.verden.gammaX + TUNING.verden.inne ? 'røyken' : 'ute'})`
        : `frosset ${når}`;
}

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: g.varmeNetter,
        framdrift: Math.min(1, dagNå(g) / TUNING.dager),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak: årsakTekst(g),
    };
}

export const MAKS_SEKUNDER = Math.ceil(TUNING.dager * TUNING.dag) + 20;

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
            { forventer: b.forventer, tilfeldig: b.tilfeldig, beskrivelse: b.beskrivelse, make: b.make },
        ])
    ),
};

export default spec;
