// Simuleringen av Brevnettet: samme regler og roboter som Brevnettet3D.tsx.

import type { PlaytestSnapshot } from '../playtest';
import type { SimSpec } from '../sim';
import { BOTS } from './bots';
import { framdrift, newGame, press, tente, update, visÅr, type Game } from './game';
import { RUNDE_SEK } from './levels';

export const GAME_ID = 'brevnettet';
export const MAKS_SEKUNDER = Math.ceil(RUNDE_SEK) + 20;

const ÅRSAK = {
    mørkt: 'alt lyset slukket',
    ringer: 'tre stuer ga opp',
    fengsel: 'fengselsårene tok alt',
};

export function årsakTekst(g: Game): string | undefined {
    if (g.fase !== 'tapt' || !g.årsak) return undefined;
    return `${ÅRSAK[g.årsak]} ${visÅr(g)} (${g.stuer.size} stuer, ${g.nøster} nøster, ${g.tråder.length} tråder)`;
}

export function snapshotOf(g: Game | null, meny = false): PlaytestSnapshot {
    if (!g || meny) return { fase: 'meny', poeng: 0, framdrift: 0, tid: 0 };
    return {
        fase: g.fase,
        poeng: Math.round(g.poeng),
        framdrift: framdrift(g),
        tid: g.t,
        valg: g.valg,
        press: press(g),
        årsak: årsakTekst(g),
    };
}

const spec: SimSpec<Game> = {
    id: GAME_ID,
    maksSekunder: MAKS_SEKUNDER,
    create: (seed) => newGame(seed),
    step: (g, dt) => {
        update(g, dt);
        g.hendelser.length = 0;
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

/** Tente stuer ved slutten - til feilsøking: npx tsx -e "import('./src/components/microgames/brevnettet/sim.ts').then(m => m.spor('binder', 3))" */
export function spor(bot: string, seed = 1) {
    const g = newGame(seed);
    const tick = BOTS[bot].make(() => 0.5);
    let acc = 0;
    let år = 0;
    while (g.fase === 'spiller' && g.t < MAKS_SEKUNDER) {
        acc += 0.05;
        if (acc >= 0.2) {
            acc = 0;
            tick(g);
        }
        update(g, 0.05);
        g.hendelser.length = 0;
        if (visÅr(g) !== år) {
            år = visÅr(g);
            console.log(
                `${år} t=${g.t.toFixed(0)} tent ${tente(g).length}/${g.stuer.size} nøster ${g.nøster} steiner ${g.steiner} poeng ${Math.round(g.poeng)}`
            );
        }
    }
    console.log(g.fase, årsakTekst(g) ?? '', Math.round(g.poeng));
}
