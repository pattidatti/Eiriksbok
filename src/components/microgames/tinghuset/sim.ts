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
            'Forelegg straks til grå mapper, avviser saker uten lov, retten til røde og tykke, venter opptil 5 s på tvillingen, sender tvillingen til salen som gir dom nærmest i tid, holder et alvorlig par tilbake når et trinn snart faller, og velger Ny rettssal og Felles behandling.',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger reglene (også avvis uten lov), men handler bare hvert fjerde tick, tar mappene i tilfeldig rekkefølge, venter bare 2,5 s på tvillingen, og bommer av og til på skranken.',
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
        beskrivelse: 'Drar tilfeldige mapper til tilfeldige skranker.',
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

/**
 * Spor av sinnet for én robot over mange runder: sinnet ved gitte sekunder per runde.
 * Brukes til å sammenligne simuleringen med nettleserrunden (filmstripen viser sinnet).
 * `npx tsx -e "import('./src/components/microgames/tinghuset/sim.ts').then(m => console.log(m.sinneSpor('seende', 40)))"`
 */
export function sinneSpor(
    name: keyof typeof BOTS = 'seende',
    runder = 40,
    ved: number[] = [20, 55, 80, 110, 150, 200]
) {
    const rows: { seed: number; vant: boolean; poeng: number; sinne: number[] }[] = [];
    for (let seed = 1; seed <= runder; seed++) {
        let r = seed * 9301 + 49297;
        const rng = () => (r = (r * 233280 + 49297) % 2147483647) / 2147483647;
        const g = newGame(seed);
        const tick = makeBot(BOTS[name], rng);
        const s: number[] = [];
        let next = 0;
        while (g.mode === 'play' && g.t < MAKS_SEKUNDER) {
            if (g.t >= next) {
                tick(g);
                next += 0.2;
            }
            update(g, 0.05);
            g.events.length = 0;
            while (s.length < ved.length && g.t >= ved[s.length]) s.push(Math.round(g.sinne * 100));
        }
        rows.push({ seed, vant: g.mode === 'won', poeng: Math.floor(g.score), sinne: s });
    }
    return rows;
}
