import { newGame, pressure, update, type Game } from './game';
import { TUNING } from './tuning';
import { BOTS, makeBot, makeRandomBot } from './bots';
import { aarNa } from './rules';
import type { SimSpec } from '../sim';
import type { PlaytestSnapshot } from '../playtest';

// Simuleringen av Elleve år: samme spillregler og roboter som KongensTallerkener.tsx.

export const GAME_ID = 'kongens-tallerkener';
export const MAKS_SEKUNDER = 260;

export const ARSAK = {
    fred: 'kista var tom før krigen - tallerkenene sto stille',
    kiste: 'kista var tom - kildene ga for lite til å betale krigen',
    parlament: 'parlamentet tok alle stengene',
} as const;

export const BOT_INFO = {
    seende: {
        forventer: 'vinner',
        beskrivelse:
            'Tegner buer fra nabo til nabo over de slakke tallerkenene med riktig fart, gir våpenskjoldene overspinn, tar imot sidene og tar få parlamentsøkter: bare rundt krigen når kista ikke holder fem sekunder (før 1639 bare i nød), og velger stanga som koster minst å gi bort.',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Treg og unøyaktig: sveiper bare hvert fjerde tick, høyst to naboer per bue, uten å sikte på overspinn. Tar en parlamentsøkt i nød før 1639 og hver gang den kommer i krigen, og gir bort stanga som vakler mest.',
    },
    'tar-alt': {
        forventer: 'taper',
        beskrivelse:
            'Sjonglerer som halvgod, men drar ned parlamentets tallerken hver gang den kommer (fra 1635) - lettvint gull, men før krigen koster hver økt to stenger.',
    },
    'aldri-parlament': {
        forventer: 'taper',
        beskrivelse:
            'Sjonglerer som halvgod, men tar aldri parlamentets penger - heller ikke når krigen kommer i 1639.',
    },
    'mester-alene': {
        forventer: 'taper',
        beskrivelse:
            'Sjonglerer like godt som seende (raske, presise buer og overspinn på våpenskjoldene), men tar aldri parlamentets penger. Beviser at ingen sjonglør kan betale krigen alene.',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Sveiper tilfeldige tallerkener med tilfeldig fart, tar imot og drar ned uten plan.',
    },
} as const;

export function snapshotOf(g: Game): PlaytestSnapshot {
    const over = g.mode === 'over';
    const span = TUNING.tid.seier - TUNING.tid.start;
    return {
        fase: over ? (g.won ? 'vunnet' : 'tapt') : 'spiller',
        poeng: Math.floor(g.score),
        framdrift: Math.min(1, (aarNa(g) - TUNING.tid.start) / span),
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: over && !g.won && g.cause ? ARSAK[g.cause] : undefined,
    };
}

const bot = (name: keyof typeof BOTS) => (rng: () => number) => makeBot(BOTS[name], rng);

const spec: SimSpec<Game> = {
    id: GAME_ID,
    maksSekunder: MAKS_SEKUNDER,
    create: (seed) => newGame(seed),
    step: (g, dt) => {
        update(g, dt);
        g.events.length = 0;
    },
    snapshot: snapshotOf,
    bots: {
        seende: { ...BOT_INFO.seende, make: bot('seende') },
        halvgod: { ...BOT_INFO.halvgod, make: bot('halvgod') },
        'tar-alt': { ...BOT_INFO['tar-alt'], make: bot('tar-alt') },
        'aldri-parlament': { ...BOT_INFO['aldri-parlament'], make: bot('aldri-parlament') },
        'mester-alene': { ...BOT_INFO['mester-alene'], make: bot('mester-alene') },
        tilfeldig: { ...BOT_INFO.tilfeldig, make: (rng) => makeRandomBot(rng) },
    },
};

export default spec;
