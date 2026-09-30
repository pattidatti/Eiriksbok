import { newGame, update, stepFx, pressure, progress, finalScore, RUN_SECONDS, OVERTIME_MAX, type G, type IO } from './game';
import { botTick, BOTS } from './bots';
import { silent, type SimSpec } from '../sim';

// Simuleringen av Tre dager i porten: samme spillregler og roboter som Thermopylae3D.tsx.

interface W {
    g: G;
    io: IO;
    tick: number;
}

export const ÅRSAK = {
    fall: 'hoplitten falt (omringet, piler eller hugg)',
    brudd: 'for mange persere kom forbi porten og inn i leiren',
};

function create(seed: number): W {
    const g = newGame(seed);
    const io: IO = {
        sfx: silent(),
        banner: () => {},
        pin: () => {},
        beat: () => {},
        lesson: () => {},
        timeScale: () => 1,
        float: () => {},
        lose: () => {},
        win: () => {},
    };
    return { g, io, tick: 0 };
}

const spec: SimSpec<W> = {
    id: 'thermopylae',
    maksSekunder: RUN_SECONDS + OVERTIME_MAX + 80,
    create,
    step: (w, dt) => {
        update(w.g, dt, w.io);
        stepFx(w.g, dt);
    },
    snapshot: ({ g }) => ({
        fase: g.ended === 'vunnet' ? 'vunnet' : g.ended === 'tapt' ? 'tapt' : 'spiller',
        poeng: finalScore(g),
        framdrift: progress(g),
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: g.ended === 'tapt' ? ÅRSAK[g.cause] : undefined,
    }),
    bots: Object.fromEntries(
        Object.entries(BOTS).map(([name, b]) => [
            name,
            {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                make: (rng) => (w: W) => {
                    w.tick += 1;
                    botTick(w.g, b.style, w.io, rng, w.tick);
                },
            },
        ]),
    ),
};

export default spec;
