// Simuleringen av Taburetten: samme regler og roboter som Taburetten3D.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { framdrift, newGame, press, update, type Game } from './game';

export const GAME_ID = 'taburetten';

const ÅRSAK = {
    gata: 'stolen landet i gata uten flertall',
    hindring: 'smell i en hindring',
    velt: 'stolen veltet etter et høyt slipp',
    tom: 'tom stol (regjeringskrise)',
} as const;

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: Math.floor(g.poeng),
        framdrift: framdrift(g),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak:
            g.mode === 'lost' && g.årsak
                ? `${ÅRSAK[g.årsak]} (${g.stol?.navn ?? 'ingen'}, ${Math.round(g.t)} s)`
                : undefined,
    };
}

/** Kampanjen varer rundt 52 s for den som vinner; Schweigaard når gata like etter. */
export const MAKS_SEKUNDER = 90;

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
