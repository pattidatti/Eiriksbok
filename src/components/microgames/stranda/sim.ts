import { newGame, pressure, update, TIDE_SECONDS, WAVES, type Game } from './game';
import { BOTS, makeBot, makeRandomBot } from './bots';
import type { SimSpec } from '../sim';

// Simuleringen av Inn mot stranda: samme spillregler og roboter som InnMotStranda.tsx.

const bot = (name: keyof typeof BOTS) => (rng: () => number) => makeBot(BOTS[name], rng);

const spec: SimSpec<Game> = {
    id: 'inn-mot-stranda',
    maksSekunder: TIDE_SECONDS + 90,
    create: (seed) => newGame(seed),
    step: (g, dt) => update(g, dt),
    snapshot: (g) => ({
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: Math.floor(g.score),
        framdrift: (g.landed + g.lost) / WAVES,
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak:
            g.mode === 'lost'
                ? g.cause === 'mine'
                    ? 'båtene traff miner under vann (utenfor sporene)'
                    : 'båtene ble skutt i senk av bunkerne'
                : undefined,
    }),
    bots: {
        seende: {
            forventer: 'vinner',
            beskrivelse:
                'Styrer unna granatringene, bruker de gule sporene når hindrene er under vann, og lar flåten ta bunkeren som skyter neste gang.',
            make: bot('seende'),
        },
        halvgod: {
            forventer: 'middels',
            beskrivelse: 'Gjør det samme, men reagerer tregere og ber sjelden flåten om hjelp.',
            make: bot('halvgod'),
        },
        'ignorerer-flaaten': {
            forventer: 'taper',
            beskrivelse: 'Styrer godt, men ber aldri slagskipene skyte på bunkerne.',
            make: bot('ignorerer-flaaten'),
        },
        'kjorer-rett': {
            forventer: 'taper',
            beskrivelse:
                'Lar flåten skyte, men kjører rett fram - bryr seg verken om granater eller spor.',
            make: bot('kjorer-rett'),
        },
        tilfeldig: {
            forventer: 'taper',
            tilfeldig: true,
            beskrivelse: 'Styrer, gasser og klikker tilfeldig uten plan.',
            make: (rng) => makeRandomBot(rng),
        },
    },
};

export default spec;
