// Simuleringen av Stempelet: samme regler og roboter som Stempelet.tsx.

import type { PlaytestSnapshot } from '../playtest';
import { seeded, type SimSpec } from '../sim';
import { BOT_EVERY, PLAYTEST_DT } from '../playtest';
import { BOTS } from './bots';
import { framdrift, newGame, press, update, årstall, type Game } from './game';
import { TUNING } from './tuning';

export const GAME_ID = 'stempelet';

const ÅRSAK = {
    papirløse: 'for mange uten papirer',
    stengt: 'kassa tom ved husleia',
} as const;

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.mode === 'won' ? 'vunnet' : g.mode === 'lost' ? 'tapt' : 'spiller',
        poeng: g.saker,
        framdrift: framdrift(g),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak:
            g.mode === 'lost' && g.årsak
                ? `${ÅRSAK[g.årsak]} (${årstall(g)}, kasse ${g.kasse})`
                : undefined,
    };
}

export const MAKS_SEKUNDER = TUNING.år.sekunder * TUNING.år.antall + 20;

const spec: SimSpec<Game> = {
    id: GAME_ID,
    maksSekunder: MAKS_SEKUNDER,
    create: (seed) => newGame(seed),
    step: (g, dt) => {
        update(g, dt);
        g.ut.length = 0;
    },
    snapshot: (g) => snapshotOf(g),
    bots: Object.fromEntries(
        Object.entries(BOTS).map(([navn, b]) => [
            navn,
            {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                make: b.make,
            },
        ])
    ),
};

export default spec;

/**
 * Måling for balansen bak dilemmaet (diagnose 2): hvor mange en robot mister i runden, og
 * kassa ved hvert nyttår. Kjør:
 * npx tsx -e "import('./src/components/microgames/stempelet/sim.ts').then(m => console.log(m.målMistet('saksbehandler')))"
 */
export function målMistet(bot: string, runder = 200) {
    const mistet: number[] = [];
    let seire = 0;
    for (let s = 1; s <= runder; s++) {
        const g = newGame(s * 7919);
        const grep = BOTS[bot].make(seeded(s * 31));
        let neste = 0;
        while (g.mode === 'play' && g.t < MAKS_SEKUNDER) {
            if (g.t >= neste) {
                grep(g);
                neste += BOT_EVERY;
            }
            update(g, PLAYTEST_DT);
            g.ut.length = 0;
        }
        mistet.push(g.mistet.length);
        if (g.mode === 'won') seire++;
    }
    mistet.sort((a, b) => a - b);
    const q = (p: number) => mistet[Math.floor(p * (mistet.length - 1))];
    return { bot, seire: seire / runder, mistet: { p10: q(0.1), median: q(0.5), p90: q(0.9) } };
}
