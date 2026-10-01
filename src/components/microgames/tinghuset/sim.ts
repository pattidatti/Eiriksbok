import { newGame, pressure, update, type Game } from './game';
import { TUNING } from './tuning';
import { BOTS, makeBot, makeRandomBot } from './bots';
import type { SimSpec } from '../sim';
import type { PlaytestSnapshot } from '../playtest';

// Simuleringen av Tinghuset: samme spillregler og roboter som Tinghuset.tsx.

export const GAME_ID = 'tinghuset';
export const MAKS_SEKUNDER = 360;

export const ARSAK = {
    vent: 'folk satt for lenge uten dom (sinnet fra ventende mapper)',
    mild: 'alvorlige saker slapp for lett (forelegg til angivere og statspoliti)',
} as const;

export const BOT_INFO = {
    seende: {
        forventer: 'vinner',
        beskrivelse:
            'Forelegg til grå mapper, retten til røde og tykke, venter opptil 5 s på tvillingen, sender tvillingen straks den kommer og velger Ny rettssal og Felles behandling.',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger reglene, men handler bare hvert fjerde tick, tar mappene i tilfeldig rekkefølge, venter bare 2,5 s på tvillingen, bommer av og til på skranken og velger kort på måfå.',
    },
    'alt-rett': {
        forventer: 'taper',
        beskrivelse:
            'Sender alle saker til rettssalen - også de lette. Ignorerer at forelegg finnes.',
    },
    'alt-forelegg': {
        forventer: 'taper',
        beskrivelse: 'Gir forelegg til alle - også angivere og statspoliti. Ignorerer rettssalen.',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Drar tilfeldige mapper til tilfeldige skranker og velger kort på måfå.',
    },
} as const;

export function snapshotOf(g: Game): PlaytestSnapshot {
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: Math.floor(g.score),
        framdrift: g.mnd / TUNING.kalender.sluttMnd,
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: g.mode === 'lost' && g.cause ? ARSAK[g.cause] : undefined,
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
        'alt-rett': { ...BOT_INFO['alt-rett'], make: bot('alt-rett') },
        'alt-forelegg': { ...BOT_INFO['alt-forelegg'], make: bot('alt-forelegg') },
        tilfeldig: { ...BOT_INFO.tilfeldig, make: (rng) => makeRandomBot(rng) },
    },
};

export default spec;
