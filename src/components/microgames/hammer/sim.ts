import { newGame, update, stepFx, pressure, progress, finalScore, battleDef, CAUSE_TEXT, BATTLES, FIRST_PLAN, PLAN_SECONDS, BATTLE_MAX, REWARD_SECONDS, type G, type IO, type LeaderId } from './game';
import { botTick, BOTS } from './bots';
import { silent, type SimSpec } from '../sim';

// Simuleringen av Hammer og ambolt: samme spillregler og roboter som HammerOgAmbolt3D.tsx.

interface W {
    g: G;
    io: IO;
    tick: number;
}

export function silentIO(): IO {
    return {
        sfx: silent(),
        banner: () => {},
        lesson: () => {},
        float: () => {},
        event: () => {},
        lose: () => {},
        win: () => {},
    };
}

export function årsak(g: G) {
    return `${CAUSE_TEXT[g.cause].toLowerCase()} (${battleDef(g).name}, slag ${g.round + 1})`;
}

const ALL: LeaderId[] = ['aleksander', 'parmenion', 'mazaios', 'oxyartes', 'poros'];

const spec: SimSpec<W> = {
    id: 'hammer-og-ambolt',
    maksSekunder: FIRST_PLAN + BATTLES * (PLAN_SECONDS + BATTLE_MAX + REWARD_SECONDS + 4),
    create: (seed, variant) => ({
        g: newGame(seed, (variant as LeaderId) ?? 'aleksander', 'ingen', ALL),
        io: silentIO(),
        tick: 0,
    }),
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
        årsak: g.ended === 'tapt' ? årsak(g) : undefined,
    }),
    bots: Object.fromEntries(
        Object.entries(BOTS).map(([name, b]) => [
            name,
            {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                variant: b.leader,
                make: (rng) => (w: W) => {
                    w.tick += 1;
                    botTick(w.g, b.style, w.io, rng, w.tick);
                },
            },
        ])
    ),
};

export default spec;
