import { newGame, pressure, update, P1, P2, type Game } from './game';
import { BOTS, makeBot, makeRandomBot } from './bots';
import type { SimSpec } from '../sim';
import type { PlaytestSnapshot } from '../playtest';

// Simuleringen av Seinen snur: samme spillregler og roboter som SeinenSnur.tsx.

const bot = (name: keyof typeof BOTS) => (rng: () => number) => makeBot(BOTS[name], rng);

export const CAUSE_TEXT = {
    skutt: 'skipet ble skutt i stykker ved borgene før 911',
    bordet: 'vikingskip entret skipet (kom borti det i sakte fart)',
    vikinger: 'vikingskipene kom forbi Rouen og tok landet',
    kongen: 'kongen tok landet tilbake fordi frankiske båter ble rammet etter 911',
} as const;

export function snapshotOf(g: Game): PlaytestSnapshot {
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: Math.floor(g.score),
        framdrift: Math.min(1, g.t / (P1 + P2)),
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: g.mode === 'lost' && g.cause ? CAUSE_TEXT[g.cause] : undefined,
    };
}

export const BOT_TEXT = {
    seende: {
        forventer: 'vinner' as const,
        beskrivelse:
            'Rammer sølvbåter utenfor rekkevidden til borgene før 911, og etter 911 bare vikingskip - styrer rundt frankerne.',
    },
    halvgod: {
        forventer: 'middels' as const,
        beskrivelse: 'Følger avtalen, men reagerer tregere, sikter dårligere og dulter iblant borti frankere.',
    },
    plyndrer: {
        forventer: 'taper' as const,
        beskrivelse: 'Fortsetter å ramme frankiske sølvbåter etter 911 (ignorerer avtalen).',
    },
    tilfeldig: {
        forventer: 'taper' as const,
        tilfeldig: true,
        beskrivelse: 'Styrer mot tilfeldige steder i elva.',
    },
};

const spec: SimSpec<Game> = {
    id: 'seinen-snur',
    maksSekunder: P1 + P2 + 20,
    create: (seed) => newGame(seed),
    step: (g, dt) => update(g, dt),
    snapshot: snapshotOf,
    bots: {
        seende: { ...BOT_TEXT.seende, make: bot('seende') },
        halvgod: { ...BOT_TEXT.halvgod, make: bot('halvgod') },
        plyndrer: { ...BOT_TEXT.plyndrer, make: bot('plyndrer') },
        tilfeldig: { ...BOT_TEXT.tilfeldig, make: (rng) => makeRandomBot(rng) },
    },
};

export default spec;
