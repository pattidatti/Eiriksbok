// Simuleringen av Stempelet: samme regler og roboter som Stempelet.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { framdrift, newGame, press, update, årstall, type Game } from './game';
import { TUNING } from './tuning';

export const GAME_ID = 'stempelet';

const ÅRSAK = {
    papirløse: 'for mange uten papirer',
    stengt: 'kassa tom ved husleia',
} as const;

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: g.saker,
        framdrift: framdrift(g),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak:
            g.mode === 'lost' && g.årsak
                ? `${ÅRSAK[g.årsak]} (${årstall(g)}, kasse ${g.kasse})`
                : undefined,
    };
}

export const MAKS_SEKUNDER = TUNING.år.sekunder * TUNING.år.antall + 20;

const spec: SimSpec<Game> = {
    id: GAME_ID,
    maksSekunder: MAKS_SEKUNDER,
    create: (seed) => newGame(seed),
    step: (g, dt) => {
        update(g, dt);
        g.ut.length = 0;
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
