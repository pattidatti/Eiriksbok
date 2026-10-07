// All tekst under runden, via useArcadeText: bannere ved nye brett, lapper ved tingen,
// de tre lærings-øyeblikkene (valget 1833, Ueland, riksretten) og poengtekst som spretter.

import type { ArcadeText } from '../arcade/useArcade';
import type { Anchor } from '../arcade/stores';
import { P } from './art';
import { FUNN } from './levels';
import { klaring } from './rules';
import type { Game, Hendelse } from './state';
import { BEAT, LAPP, SJANSE_LÆRDOM } from './texts';
import { TUNING } from './tuning';
import { BUDSJETT } from './hud';

export interface Coach {
    text: ArcadeText;
    sagt: Set<string>;
    /** Når en lapp sist ble vist (spilltid), så de ikke kommer for tett. */
    sist: Map<string, number>;
    flate: (x: number, y: number) => Anchor;
    vedBallong: (dy: number) => Anchor;
    vedVerden: (wx: number, y: number) => Anchor;
    skjerm: (x: number, y: number) => { x: number; y: number };
    spill: () => Game;
    /** En solid lapp på flata (960 x 540) som spretter inn og blekner. */
    lapp: (tekst: string, x: number, y: number, farge?: string, stor?: boolean, sek?: number) => void;
}

const BX = TUNING.ballong.skjermX;

export function coachHendelse(h: Hendelse, g: Game, c: Coach) {
    const { text, sagt } = c;
    /** Lapp ved ballongen (flatekoordinater). */
    const ved = (tekst: string, dy: number, farge?: string, stor?: boolean, sek?: number) =>
        c.lapp(tekst, BX + 70, g.y + dy, farge, stor, sek);
    switch (h.slag) {
        case 'brett':
            // Ingen banner midt øverst: bildeteksten nede i margen viser stedet.
            break;
        case 'valg': {
            // Gjenvalgt vises som et rykk i valgflagget (fx.flagg), ikke som en lapp.
            if (h.hatt && !sagt.has('hatt')) {
                sagt.add('hatt');
                ved('+1 embetsmann om bord: tyngre', -40, P.karmin);
            }
            break;
        }
        case 'funn': {
            const f = FUNN.find((x) => x.id === h.id);
            if (f) {
                ved(f.navn, -80, P.silke, true, 1.8);
                text.lesson(`funn-${f.id}`, f.fakta, f.id === 'olaboka' ? 3 : 1);
            }
            if (h.id === 'olaboka') ved(`Brenneren ${Math.round(TUNING.penger.olaboka * 100)} % billigere`, -40, P.silke, false, 2.4);
            break;
        }
        case 'veiskille':
            if (h.port && h.vei === 'under') ved('Under fjellet! Gratis', -110, P.silke, true);
            else if (h.port) ved('Over fjellet: dyrt', -110, P.karmin, false, 1.2);
            break;
        case 'bevilg':
            if (h.ja) ved(`Bevilget: -${h.pris} Spd. og budsjett`, -110, P.karmin, true, 2.2);
            else ved(`Nei til kongen! +${h.bonus} Spd.`, -110, P.silke, true, 2);
            if (h.hårfint) ved(h.ja ? 'Akkurat under banneret!' : 'Hårfint over porten!', -60, P.silke, false, 1);
            break;
        case 'riksrett':
            ved(`Riksrett ${h.n}/3: tau kuttet!`, -110, P.karmin, true, 1.4);
            break;
        case 'ganger':
            if (h.ganger > h.fra) {
                // Portrettet spretter og mynter flyr dit for hvert trinn; lapp bare ved milepælene.
                // Lappen står under Ueland-portrettet oppe til venstre: ikke midt i bildet, og
                // aldri oppå navnet på en port.
                if (h.ganger === TUNING.ganger.maks) c.lapp(`Ueland ×${h.ganger}! Full fart!`, 20, 118, P.silke, true, 1.1);
                else if (h.ganger === 5) c.lapp('Ueland ×5!', 20, 118, P.silke, true, 1);
            }
            break;
        case 'sjanse':
            ved(
                (h.årsak === 'valg' ? 'Stemt ut!' : 'Rett i fjellet!') +
                    ` Tilbake til ${h.tilbake}` +
                    (h.straff > 0 ? `, -${h.straff} Spd.` : ''),
                -120,
                P.karmin,
                true,
                2
            );
            if (!sagt.has('sjanse')) {
                sagt.add('sjanse');
                text.lesson('sjanse', SJANSE_LÆRDOM, 1.5);
            }
            break;
        case 'bondeting':
            // Ingen banner eller lapp her: valget (lærings-øyeblikket) er det eneste nye i 1833.
            // Baren gløder i gull, og brenneren blir billigere uten ord.
            break;
        case 'stemme':
            ved(`Stemme! +${h.verdi}`, -60, P.silke, true, 1);
            break;
        case 'roret': {
            const t0 = g.t;
            text.beatOnce('roret', BEAT.roret.tittel, BEAT.roret.tekst, {
                at: c.vedBallong(-60),
                until: () => c.spill().ror || c.spill().t > t0 + 2.5,
            });
            text.point('ror', LAPP.ror, c.vedBallong(20), {
                until: () => c.spill().ror,
                seconds: 5,
            });
            break;
        }
        default:
            break;
    }
}

/** Lapper og lærings-øyeblikk som kommer av tilstanden. */
export function coach(g: Game, c: Coach) {
    const { text, sagt } = c;
    if (!sagt.has('hold') && g.t > 0.6) {
        sagt.add('hold');
        // Ved tasten nede til venstre, ikke over ballongen: der ser eleven grepet.
        text.point('hold', LAPP.hold, c.flate(120, 492), {
            until: () => c.spill().varme > 0.6,
            seconds: 10,
        });
    }
    // Ola-boka: pek på den i god tid, så eleven kan dukke ned og ta den.
    if (!sagt.has('ola')) {
        const f = g.ter.funn.find((x) => x.id === 'olaboka' && !x.tatt);
        if (f && f.x - g.x < 560 && f.x > g.x) {
            sagt.add('ola');
            text.point('ola', LAPP.ola, c.vedVerden(f.x, f.y - 20), {
                until: () => f.tatt || f.x < c.spill().x,
                seconds: 5,
            });
        }
    }
    // Budsjettkortet i HUD-en (oppe til venstre): anker til lærings-øyeblikket om valget.
    const vedBar = () => c.skjerm(BUDSJETT.x + 90, BUDSJETT.y + 40);
    if (!sagt.has('grense') && g.år >= TUNING.penger.førsteEkteValg - 1.2) {
        sagt.add('grense');
        // En pinne ved baren, ikke et kort som stopper spillet: baren som tømmes viser resten.
        text.point('valg', LAPP.grense, vedBar, { seconds: 4.5 });
    }
    // Jernbanen og den første porten trenger ingen lapp: veiskillet viser de to løpene med
    // ord, pris og bonus på selve løpet.
    // Ueland kommer om bord i 1840,5 (ca. 34 s), alene: skrapeåsene 1842 er øvingsryggen. Første
    // port kommer først ved Kongsvingerbanen (ca. 72 s).
    if (!sagt.has('ueland') && g.år >= g.uelandÅr + 0.5 && !g.bæres && g.mode === 'play') {
        sagt.add('ueland');
        const t0 = g.t;
        text.beatOnce('ueland', BEAT.ueland.tittel, BEAT.ueland.tekst, {
            at: c.vedBallong(-60),
            until: () => c.spill().t > t0 + 3,
        });
    }
    // Riksretten: pek på den første stemmen.
    if (!sagt.has('riksrett')) {
        const st = g.ter.riksrett[0];
        if (st && !st.tatt && st.x - g.x < 600 && st.x > g.x) {
            sagt.add('riksrett');
            text.point('riksrett', LAPP.riksrett, c.vedVerden(st.x, st.y - 20), {
                until: () => st.tatt || st.x < c.spill().x,
                seconds: 4,
            });
        }
    }
    // Nesten-bom: hårfint over fjellet.
    const kl = klaring(g);
    if (kl > 0 && kl < 7 && g.t - (c.sist.get('nesten') ?? -9) > 3) {
        c.sist.set('nesten', g.t);
        c.lapp('Hårfint!', BX - 70, g.y + 10, P.silke, false, 0.9);
    }
}
