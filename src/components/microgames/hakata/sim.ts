import { newGame, update, stepFx, pressure, progress, finalScore, RUN_SECONDS, type G, type IO } from './game';
import { botTick, BOTS } from './bots';
import { silent, type SimSpec } from '../sim';

// Simuleringen av Guddommelig vind: samme spillregler og roboter som GuddommeligVind3D.tsx.

interface W {
    g: G;
    io: IO;
    tick: number;
}

const ÅRSAK = {
    land: 'for mange mongoler kom over muren og i land',
    fall: 'eleven falt (piler, bomber, mannen på muren)',
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
    id: 'guddommelig-vind',
    maksSekunder: RUN_SECONDS + 20,
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
        ])
    ),
};

export default spec;
