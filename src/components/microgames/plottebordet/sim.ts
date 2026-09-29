import { newGame, stepFx, update, RUN_SECONDS, type Cause, type G, type IO } from './game';
import { botTick, BOT_STYLES } from './bots';
import { silent, type SimSpec } from '../sim';

// Simuleringen av Plottebordet: samme spillregler og roboter som Plottebordet3D.tsx.
// Seier og tap kommer som io.win()/io.lose() - her fanges de i `end`, slik
// komponenten stopper løkka og regner ut sluttpoengene.

interface W {
    g: G;
    io: IO;
    end: { won: boolean; cause: Cause } | null;
}

const ÅRSAK: Record<Cause, string> = {
    luft: 'Luftwaffe tok over himmelen (invasjonsmåleren ble full)',
    fly: 'ingen fly igjen',
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
            if (!w.end) w.end = { won: true, cause: 'luft' };
        },
    };
    return w;
}

const bot =
    (name: string) =>
    () =>
    (w: W): void => {
        if (!w.end) botTick(w.g, BOT_STYLES[name], w.io);
    };

const spec: SimSpec<W> = {
    id: 'plottebordet-3d',
    maksSekunder: RUN_SECONDS + 20,
    create,
    step: (w, dt) => {
        if (!w.end) update(w.g, dt, w.io);
        stepFx(w.g, dt);
    },
    snapshot: ({ g, end }) => ({
        fase: !end ? 'spiller' : end.won ? 'vunnet' : 'tapt',
        poeng: Math.floor(g.score + (end?.won ? 2000 + Math.round((100 - g.meter) * 15) : 0)),
        framdrift: g.t / RUN_SECONDS,
        tid: g.t,
        årsak: end && !end.won ? ÅRSAK[end.cause] : undefined,
    }),
    bots: {
        seende: {
            forventer: 'vinner',
            beskrivelse:
                'Sender nærmeste ledige skvadron i det radaren ser raidet over havet, to mot store raid.',
            make: bot('seende'),
        },
        kysten: {
            forventer: 'taper',
            beskrivelse:
                'Samme fordeling, men venter til raidet er over kysten (som uten radar, bare observatører).',
            make: bot('kysten'),
        },
        patrulje: {
            forventer: 'taper',
            beskrivelse:
                'Bruker ikke radaren: holder alle skvadronene på patrulje langs kysten og sender dem ut igjen så fort de har tanket.',
            make: bot('patrulje'),
        },
    },
};

export default spec;
