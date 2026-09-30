import { newGame, update, pressure, progress, finalScore, RUN_SECONDS, ÅRSAK, ÅR, type G } from './game';
import { botTick, BOTS } from './bots';
import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';

// Simuleringen av Loddposen: samme spillregler og roboter som Loddposen.tsx.

interface W {
    g: G;
    tick: number;
}

export function snapshotOf(g: G): PlaytestSnapshot {
    return {
        fase: g.ended === 'vunnet' ? 'vunnet' : g.ended === 'tapt' ? 'tapt' : 'spiller',
        poeng: finalScore(g),
        framdrift: progress(g),
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: g.ended === 'tapt' && g.cause ? `${ÅRSAK[g.cause]} (${ÅR[g.trekning]})` : undefined,
    };
}

const spec: SimSpec<W> = {
    id: 'loddposen',
    maksSekunder: RUN_SECONDS + 20,
    create: (seed) => ({ g: newGame(seed), tick: 0 }),
    step: (w, dt) => {
        update(w.g, dt);
        w.g.events.length = 0;
    },
    snapshot: ({ g }) => snapshotOf(g),
    bots: Object.fromEntries(
        Object.entries(BOTS).map(([name, b]) => [
            name,
            {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                make: (rng) => (w: W) => {
                    w.tick += 1;
                    botTick(w.g, b.style, rng, w.tick);
                },
            },
        ])
    ),
};

export default spec;
