// Simuleringen av Pengeballongen: samme regler og roboter som Pengeballongen.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { newGame, update, type Game } from './game';
import { press } from './rules';
import { RUNDE } from './terrain';

export const GAME_ID = 'pengeballongen';

export function årsakTekst(g: Game): string | undefined {
    if (g.mode !== 'lost') return undefined;
    const år = Math.floor(g.år);
    return g.årsak === 'valg'
        ? `stemt ut ved valget (${år}): brukte for mye`
        : `krasjet i fjellet (${år < 1833 ? 'før 1833' : år < 1850 ? '1833-1849' : år < 1870 ? '1850-1869' : '1870-'})`;
}

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: Math.floor(g.spart),
        framdrift: Math.min(1, g.t / RUNDE),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak: årsakTekst(g),
    };
}

export const MAKS_SEKUNDER = Math.ceil(RUNDE) + 30;

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
