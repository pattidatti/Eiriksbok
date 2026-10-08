// Simuleringen av Rederens kart: samme regler og roboter som RederensKart.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { newGame, update, type Game } from './game';
import { framdrift, hvalIHavet, press } from './rules';
import { TUNING } from './tuning';

export const GAME_ID = 'rederens-kart';

export function årsakTekst(g: Game): string | undefined {
    if (g.mode !== 'lost') return undefined;
    return g.årsak === 'konkurs'
        ? `konkurs ${g.år} (${g.båter.length} båter, ${hvalIHavet(g)} hval igjen)`
        : `tomt hav ${g.år} (tatt ${g.totaltTatt} hval)`;
}

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: g.poeng,
        framdrift: framdrift(g),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak: årsakTekst(g),
    };
}

const P = TUNING.tid.perioder;
const runde = P.reduce((s, p, i) => s + ((P[i + 1]?.fra ?? TUNING.tid.seier) - p.fra) * p.sek, 0);
export const MAKS_SEKUNDER = Math.ceil(runde) + 20;

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
