import type { Rng } from '../sim';
import {
    challenge,
    goToX,
    inDuel,
    inReach,
    setWalk,
    slotX,
    retreat,
    setShield,
    swipe,
    wind,
    LAND_MAX,
    type G,
    type IO,
    type Ladder,
} from './game';

// Selvspill-robotene for Guddommelig vind. De bruker de samme grepene som eleven
// (swipe, setShield, goTo, challenge) og ser bare det eleven ser: stigene, buene som
// spennes, bombene og vinden i fanene.

export type BotStyle = 'seende' | 'halvgod' | 'hugger' | 'tilfeldig';

const danger = (l: Ladder) => (l.state === 'faller' || !l.men.length ? 0 : l.top >= 0 ? 2 : l.men[0]);

/** Er det lurt å la mannen komme til topps og hugge ham? Bare når ingen står rett bak ham. */
function worthKilling(g: G, l: Ladder) {
    if (wind(g) > 0.55 || g.land > LAND_MAX * 0.35) return false;
    return l.men.length === 1 && l.queue === 0;
}

export function botTick(g: G, style: BotStyle, io: IO, rng: Rng, tick: number) {
    if (g.ended || g.storm >= 0) return;
    if (style === 'tilfeldig') return randomTick(g, io, rng);
    if (style === 'halvgod' && tick % 7 === 0) return;

    // Tvekampen.
    if (inDuel(g)) {
        const d = g.duel!;
        if (style !== 'hugger') return retreat(g);
        if (d.champ === 'løfter') return setShield(g, true);
        setShield(g, false);
        if (d.champ === 'åpen') swipe(g, [{ kind: 'kjempe' }], io, 'hugg');
        return;
    }
    if (g.duel?.phase === 'tilbud' && style === 'hugger' && Math.abs(g.duel.x - g.px) < 3) {
        challenge(g, io);
        return;
    }

    // Skjold når pilene er i lufta over murdelen.
    const volley = g.volleys.find((v) => Math.abs(v.x - g.px) < 2.8 && v.t < 0.75);
    if (volley) return setShield(g, true);
    if (g.shield) setShield(g, false);

    const mine = g.ladders.filter((l) => inReach(g, slotX(l.sec, l.slot)) && l.state !== 'faller');

    // Bomber på muren: slå dem i sjøen.
    const bomb = g.bombs.find((b) => inReach(g, slotX(b.sec, b.slot)) && b.state !== 'slått' && b.t < 1.9);
    if (bomb && style !== 'hugger') return void swipe(g, [{ kind: 'bombe', id: bomb.id }], io, 'begge');

    // Mann på muren: hugg.
    const top = mine.find((l) => l.top >= 0);
    if (top) return void swipe(g, [{ kind: 'stige', id: top.id }], io, 'hugg');

    // Stige med folk: skyv (hugger venter heller på å hugge).
    if (style !== 'hugger') {
        const push = mine
            .filter((l) => l.men.length && l.raise > 0.6 && !(style === 'seende' && worthKilling(g, l)))
            .sort((a, b) => danger(b) - danger(a))[0];
        if (push) return void swipe(g, [{ kind: 'stige', id: push.id }], io, 'skyv');
    }

    // Hvor brenner det? Gå til stigen som haster mest (nær stiger teller litt mer).
    let bestX: number | null = null;
    let best = 0.3;
    for (const l of g.ladders) {
        const x = slotX(l.sec, l.slot);
        const v = danger(l) - Math.abs(x - g.px) * 0.03;
        if (v > best) {
            best = v;
            bestX = x;
        }
    }
    if (bestX !== null && Math.abs(bestX - g.px) > 0.6) goToX(g, bestX);
}

function randomTick(g: G, io: IO, rng: Rng) {
    const r = rng();
    if (r < 0.15) return setWalk(g, rng() < 0.33 ? -1 : rng() < 0.5 ? 1 : 0);
    if (r < 0.3) return setShield(g, rng() < 0.4);
    if (r < 0.35) return void challenge(g, io);
    setShield(g, false);
    const opts = g.ladders.filter((l) => inReach(g, slotX(l.sec, l.slot)));
    if (opts.length && rng() < 0.6) {
        const l = opts[Math.floor(rng() * opts.length)];
        swipe(g, [{ kind: 'stige', id: l.id }], io, rng() < 0.5 ? 'hugg' : 'skyv');
    } else if (g.duel && g.duel.phase === 'kamp') swipe(g, [{ kind: 'kjempe' }], io, 'hugg');
    else swipe(g, [], io, 'begge');
}

export const BOTS: Record<string, { forventer: 'vinner' | 'taper' | 'middels'; tilfeldig?: boolean; beskrivelse: string; style: BotStyle }> = {
    seende: {
        forventer: 'vinner',
        beskrivelse:
            'Skyver stigene før mennene når toppen, hugger bare når ingen står bak, skjold når buene spennes, går dit faren er størst og sier nei til tvekamp.',
        style: 'seende',
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse: 'Følger samme regel - skyv, ikke vent - men reagerer tregere (nøler hvert sjuende øyeblikk og mister da stiger).',
        style: 'halvgod',
    },
    hugger: {
        forventer: 'taper',
        beskrivelse:
            'Jakter ære: lar mongolene komme til topps for å hugge dem, og tar hver tvekamp. Skyver aldri en stige med folk.',
        style: 'hugger',
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Sveiper, flytter, løfter skjoldet og tar tvekamper tilfeldig.',
        style: 'tilfeldig',
    },
};
