// All tekst under runden: bannere for nye brett, korte lapper ved tingen de handler om,
// lærings-øyeblikket (første båt: lyset ser røyken) og «Dette skjedde». Lappene står fast.

import type { ArcadeText } from '../arcade/useArcade';
import type { Anchor } from '../arcade/stores';
import { P } from './art';
import type { Lapp } from './draw';
import type { Fx } from './fx';
import { STABEL } from './fx';
import type { Game, Hendelse } from './game';
import { BRETT } from './levels';
import { bakke, lysTopp } from './rules';
import { BEAT, LAPP } from './texts';
import { TUNING } from './tuning';

const T = TUNING;
const G = T.verden.gammaX;
const GY = bakke(G);

export interface Coach {
    text: ArcadeText;
    lapper: Lapp[];
    sagt: Set<string>;
    /** Sekunder til neste «kaldt»-varsel kan komme. */
    varsle: number;
    /** Flatepunkt (960 x 540) -> punkt i spillvinduet. */
    flate: (x: number, y: number) => Anchor;
    spill: () => Game;
}

export function nyCoach(text: ArcadeText, flate: Coach['flate'], spill: () => Game): Coach {
    return { text, lapper: [], sagt: new Set(), varsle: 0, flate, spill };
}

/** En fast papirlapp på flata. Én om gangen, så de aldri dekker hverandre. */
export function lapp(c: Coach, tekst: string, x: number, y: number, sek = 3) {
    c.lapper = [{ tekst, x, y, igjen: sek, sek }];
}

export function coachStart(c: Coach) {
    c.lapper = [];
    c.sagt.clear();
    c.varsle = 0;
    c.text.banner(BRETT[0].tittel, P.glød);
    if (BRETT[0].nytt) lapp(c, BRETT[0].nytt, 600, 215, 5);
}

export function coachHendelse(c: Coach, h: Hendelse) {
    const { text, sagt } = c;
    switch (h.type) {
        case 'brett': {
            const b = BRETT[h.brett];
            text.banner(b.tittel, P.glød);
            if (b.nytt) lapp(c, b.nytt, 600, 215, 4.5);
            break;
        }
        case 'båt':
            lapp(c, LAPP.båt, 790, 330, 3);
            break;
        case 'plukk':
            if (!sagt.has('plukk')) {
                sagt.add('plukk');
                lapp(c, LAPP.bær, h.x + 90, bakke(h.x) - 60, 2.5);
            }
            break;
        case 'lever':
            text.float(`+${h.kubber} ved`, ...punkt(c, STABEL.x, STABEL.y - 30), P.glød);
            break;
        case 'tom':
            if (c.varsle <= 1) {
                lapp(c, LAPP.tom, G + 120, GY - 112, 2.5);
                c.varsle = 3;
            }
            break;
        case 'tap':
            if (h.årsak === 'funnet') text.banner('FUNNET', P.fare);
            else text.banner('BÅLET GIKK UT', P.fare);
            break;
        case 'seier':
            text.banner('HJELPEN KOM', P.glød);
            break;
        default:
            break;
    }
}

const punkt = (c: Coach, x: number, y: number): [number, number] => {
    const p = c.flate(x, y)();
    return p ? [p.x, p.y] : [0, 0];
};

/** Lapper og lærings-øyeblikket som kommer av tilstanden, og nesten-bom fra spillfølelsen. */
export function coachTick(c: Coach, g: Game, fx: Fx, dt: number) {
    const { text, sagt } = c;
    for (const l of c.lapper) l.igjen -= dt;
    c.lapper = c.lapper.filter((l) => l.igjen > 0);
    if (g.mode !== 'play') return;

    // Lærings-øyeblikket: første båt. Lyset tennes, og eleven ser det krype opp mot røyken i
    // sakte film. Det stanser rett under gamma (øvingen), så ingen taper på å lese.
    const p = g.patrulje;
    if (p && p.øving && p.fase === 'lyser' && !sagt.has('beat')) {
        sagt.add('beat');
        text.beatOnce('lyset', BEAT.lyset.tittel, BEAT.lyset.tekst, {
            // Ringen på strålen midt i lia, så kortet aldri dekker gamma, røyken eller lysflekken.
            at: c.flate(520, 330),
            until: () => {
                const q = c.spill().patrulje;
                return !q || q.fase !== 'lyser' || q.lysX < lysTopp(true) + 40;
            },
        });
    }
    if (fx.såVidt) lapp(c, LAPP.såVidt, G + 120, GY - 112, 2.2);
    else if (fx.nesten === 1 && !sagt.has('forbi')) {
        sagt.add('forbi');
        lapp(c, LAPP.forbi, G + 120, GY - 112, 2.2);
    }

    // Si fra når bålet ikke kan fyres, eller holder på å gå ut.
    c.varsle -= dt;
    if (c.varsle <= 0 && g.varme < T.varme.rim) {
        if (g.stabel > 0 && g.bål === 0) {
            lapp(c, LAPP.legg, G + 120, GY - 112, 2.5);
            c.varsle = 6;
        } else if (g.stabel === 0 && g.fang === 0) {
            lapp(c, LAPP.kaldt, G + 120, GY - 112, 2.5);
            c.varsle = 6;
        }
    }
}
