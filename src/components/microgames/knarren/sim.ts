import { drain, newGame, pressure, progress, update, DAY, WATER_DAYS, type Game } from './game';
import { BOTS, makeBot, makeRandomBot } from './bots';
import type { SimSpec } from '../sim';

// Simuleringen av Kurs for Grønland: samme spillregler og roboter som KursForGronland3D.tsx.

export const ÅRSAK = {
    sank: 'knarren fylte seg med sjø og sank',
    is: 'for langt nord - stengt inne av drivisen ved Grønland',
    forbi: 'for langt sør - seilte forbi Grønland ut i åpent hav',
    tørst: 'drikkevannet tok slutt før land',
} as const;

const bot = (name: keyof typeof BOTS) => (rng: () => number) => makeBot(BOTS[name], rng);

const spec: SimSpec<Game> = {
    id: 'kurs-for-gronland',
    maksSekunder: DAY * WATER_DAYS + 30,
    create: (seed) => newGame(seed),
    step: (g, dt) => {
        update(g, dt);
        drain(g);
    },
    snapshot: (g) => ({
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: Math.floor(g.score),
        framdrift: progress(g),
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: g.mode === 'lost' && g.cause ? ÅRSAK[g.cause] : undefined,
    }),
    bots: {
        seende: {
            forventer: 'vinner',
            beskrivelse:
                'Leser solbrettet hver middag, lærer seg havstrømmen og holder imot, rever før vindkastene og øser i tide.',
            make: bot('seende'),
        },
        halvgod: {
            forventer: 'middels',
            beskrivelse:
                'Leser middagssola og retter opp, men holder ikke imot strømmen, reagerer tregt og rever bare på noen av kastene.',
            make: bot('halvgod'),
        },
        'ignorerer-sola': {
            forventer: 'taper',
            beskrivelse:
                'Seiler godt - rever og øser - men holder bare kursen rett vest og leser aldri middagssola.',
            make: bot('ignorerer-sola'),
        },
        tilfeldig: {
            forventer: 'taper',
            tilfeldig: true,
            beskrivelse: 'Styrer, rever og øser tilfeldig uten plan.',
            make: (rng) => makeRandomBot(rng),
        },
    },
};

export default spec;
