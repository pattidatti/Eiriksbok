import { newGame, update, pressure, progress, finalScore, type G } from './game';
import { makeBot, BOTS } from './bots';
import { getLevel, type LevelId } from './level';
import type { SimSpec } from '../sim';

// Simuleringen av «Frisk puss!»: samme spillregler og roboter som FriskPuss3D.tsx.
// Standard er full bane («Skapelsen»). Variant 'forste' kjører opplæringsbanen.

interface W {
    g: G;
}

export const ÅRSAK = {
    puss: 'pussen tørket (uten sjekkpunkter)',
    paven: 'paven tok deg igjen',
    slam: 'kalkslammet nådde deg',
    dag: 'arbeidsdagen var over før bøtta var oppe',
};

const levelOf = (variant?: string): LevelId => (variant === 'forste' ? 'forste' : 'skapelsen');

const spec: SimSpec<W> = {
    id: 'frisk-puss',
    maksSekunder: getLevel('skapelsen').clock + 20,
    create: (seed, variant) => ({ g: newGame(seed, { level: levelOf(variant) }) }),
    step: (w, dt) => update(w.g, dt),
    snapshot: ({ g }) => ({
        fase: g.ended === 'vunnet' ? 'vunnet' : g.ended === 'tapt' ? 'tapt' : 'spiller',
        poeng: finalScore(g),
        framdrift: progress(g),
        tid: g.t,
        valg: g.valg,
        press: pressure(g),
        årsak: g.ended === 'tapt' ? ÅRSAK[g.cause] : undefined,
    }),
    bots: Object.fromEntries(
        Object.entries(BOTS).map(([name, b]) => [
            name,
            {
                forventer: b.forventer,
                tilfeldig: b.tilfeldig,
                beskrivelse: b.beskrivelse,
                make: (rng) => {
                    const bot = makeBot(b.style, rng);
                    return (w: W) => bot(w.g);
                },
            },
        ])
    ),
};

export default spec;
