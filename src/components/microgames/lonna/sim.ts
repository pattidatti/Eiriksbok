import { newGame, stepParticles, update, RUN_SECONDS, type Cause, type G, type IO } from './game';
import { botTick, newBotMemory, BOT_STYLES } from './bots';
import { silent, type SimSpec } from '../sim';

// Simuleringen av Løp med lønna: samme spillregler og roboter som LopMedLonna3D.tsx.
// Seier og tap kommer som io.win()/io.lose() og fanges i `end`.

interface W {
    g: G;
    io: IO;
    end: { won: boolean; cause: Cause } | null;
}

const ÅRSAK: Record<Cause, string> = {
    sult: 'tomt for mat',
    kulde: 'ovnen ble kald',
};

function create(): W {
    const w = { g: newGame(), end: null } as W;
    w.io = {
        sfx: silent(),
        banner: () => {},
        pin: () => {},
        beat: () => {},
        lesson: () => {},
        timeScale: () => 1,
        float: () => {},
        lose: (cause) => {
            if (w.end) return;
            w.g.cause = cause;
            w.end = { won: false, cause };
        },
        win: () => {
            if (w.end) return;
            w.g.target = null;
            w.end = { won: true, cause: 'sult' };
        },
    };
    return w;
}

const bot = (name: string) => () => {
    const mem = newBotMemory();
    return (w: W): void => {
        if (!w.end) botTick(w.g, mem, BOT_STYLES[name]);
    };
};

const spec: SimSpec<W> = {
    id: 'lop-med-lonna-3d',
    maksSekunder: RUN_SECONDS + 25,
    create,
    step: (w, dt) => {
        if (!w.end) update(w.g, dt, w.io);
        stepParticles(w.g, dt);
    },
    snapshot: ({ g, end }) => ({
        fase: !end ? 'spiller' : end.won ? 'vunnet' : 'tapt',
        poeng: Math.floor(g.score + (end?.won ? 2000 + Math.round((g.food + g.heat) * 8) : 0)),
        framdrift: g.t / RUN_SECONDS,
        tid: g.t,
        årsak: end && !end.won ? ÅRSAK[end.cause] : undefined,
    }),
    bots: {
        seende: {
            forventer: 'vinner',
            beskrivelse:
                'Henter lønna med en gang, handler mat og kull på nærmeste åpne butikk og kjører varene hjem.',
            make: bot('seende'),
        },
        'tar-pengene-hjem': {
            forventer: 'taper',
            beskrivelse: 'Samme handel, men tar alltid lønna med hjem før den handler.',
            make: bot('tar-pengene-hjem'),
        },
        'bare-mat': {
            forventer: 'taper',
            beskrivelse: 'Gjør lønna om til mat med en gang, men kjøper aldri kull.',
            make: bot('bare-mat'),
        },
    },
};

export default spec;
