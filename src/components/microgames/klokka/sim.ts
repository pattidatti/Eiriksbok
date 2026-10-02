// Simuleringen av Båtdekket klokka 00.45: samme regler og roboter som BatdekketKlokka.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { update, type Game } from './game';
import { brukt, ferdigBåter, press } from './rules';
import { newGame } from './state';
import { TUNING } from './tuning';
import { ALLE_BÅTER } from './levels';

export const GAME_ID = 'klokka-0045';

export function årsakTekst(g: Game): string | undefined {
    if (g.mode !== 'lost') return undefined;
    return g.årsak === 'tomme' ? 'for mange tomme plasser' : 'båtene gikk tapt';
}

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: brukt(g),
        framdrift: ferdigBåter(g) / ALLE_BÅTER.length,
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak: årsakTekst(g),
    };
}

const spec: SimSpec<Game> = {
    id: GAME_ID,
    maksSekunder: Math.ceil(TUNING.slutt) + 30,
    create: (seed) => newGame(seed),
    step: (g, dt) => update(g, dt),
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
