import { newGame, update, stepFx, pressure, progress, finalScore, RUN_SECONDS, type G, type IO, type Cause } from './game';
import { botTick, BOTS } from './bots';
import { silent, type SimSpec } from '../sim';

// Simuleringen av Løpegravene: samme spillregler og roboter som Lopegravene3D.tsx.

interface W {
    g: G;
    io: IO;
    tick: number;
}

export const ÅRSAK: Record<Cause, string> = {
    storm: 'svenskene stormet over glacis og brøt muren',
    beleiring: 'beleiringskanonene knuste tårnene, og stormen tok resten',
    karl: 'Karl XII og livgarden nådde muren',
};

export function silentIO(): IO {
    return {
        sfx: silent(),
        banner: () => {},
        pin: () => {},
        beat: () => {},
        lesson: () => {},
        timeScale: () => 1,
        float: () => {},
        event: () => {},
        lose: () => {},
        win: () => {},
    };
}

const spec: SimSpec<W> = {
    id: 'lopegravene-1718',
    maksSekunder: RUN_SECONDS + 240,
    create: (seed) => ({ g: newGame(seed), io: silentIO(), tick: 0 }),
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
        årsak: g.ended === 'tapt' ? `${ÅRSAK[g.cause]} (natt ${g.wave})` : undefined,
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
