// All tekst under runden, via useArcadeText: bannere ved nye brett, lapper ved tingen,
// de tre lærings-øyeblikkene (valget 1833, Ueland, riksretten) og poengtekst som spretter.

import type { ArcadeText } from '../arcade/useArcade';
import type { Anchor } from '../arcade/stores';
import { P } from './art';
import { BRETT, FUNN } from './levels';
import { klaring } from './rules';
import type { Game, Hendelse } from './state';
import { BEAT, LAPP } from './texts';
import { TUNING } from './tuning';

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
}

const BX = TUNING.ballong.skjermX;

export function coachHendelse(h: Hendelse, g: Game, c: Coach) {
    const { text, sagt } = c;
    const ved = (dy: number) => c.skjerm(BX + 36, g.y + dy);
    switch (h.slag) {
        case 'brett':
            text.banner(BRETT[h.brett].tittel);
            if (h.brett === 1 && !sagt.has('stabel')) {
                sagt.add('stabel');
                text.point('stabel', LAPP.stabel, c.flate(90, 150), { seconds: 5 });
            }
            break;
        case 'valg': {
            const p = ved(-110);
            if (!h.ekte) {
                text.float('Bøndene vinker deg forbi', p.x, p.y, P.kritt);
                if (!sagt.has('vinker')) {
                    sagt.add('vinker');
                    text.point('vinker', LAPP.vinker, c.flate(90, 150), { seconds: 4 });
                }
            } else if (h.år === TUNING.penger.førsteEkteValg) {
                text.banner('Bondestortinget!', P.silke);
            } else text.float(`Gjenvalgt ${h.år}!`, p.x, p.y, P.silkeMørk, true);
            if (h.hatt) {
                const q = ved(-30);
                text.float('+1 flosshatt', q.x + 30, q.y, P.karmin);
            }
            break;
        }
        case 'funn': {
            const f = FUNN.find((x) => x.id === h.id);
            const p = ved(-70);
            if (f) {
                text.float(f.navn, p.x, p.y, P.silkeMørk, true, 1.6);
                text.lesson(`funn-${f.id}`, f.fakta, 1);
            }
            break;
        }
        case 'veiskille':
            if (h.konge && h.vei === 'under') {
                const p = ved(-100);
                text.float('Under bommen! Ueland +1', p.x, p.y, P.silkeMørk, true);
            } else if (h.hatt) {
                const p = ved(-110);
                text.float('Kongeveien: brenneren +15 %', p.x, p.y, P.karmin, true);
            }
            break;
        case 'ganger':
            if (h.ganger > h.fra) {
                const p = ved(-50);
                text.float(`Ueland ×${h.ganger}`, p.x + 20, p.y, P.silkeMørk, h.ganger >= 4);
                if (h.ganger === 2)
                    text.beatOnce('ueland', BEAT.ueland.tittel, BEAT.ueland.tekst, {
                        at: c.vedBallong(-60),
                        until: () => c.spill().ganger !== 2,
                    });
            }
            break;
        default:
            break;
    }
}

/** Lapper og lærings-øyeblikk som kommer av tilstanden. */
export function coach(g: Game, c: Coach) {
    const { text, sagt } = c;
    if (!sagt.has('hold') && g.t > 0.6) {
        sagt.add('hold');
        text.point('hold', LAPP.hold, c.vedBallong(-50), {
            until: () => c.spill().varme > 0.6,
            seconds: 10,
        });
    }
    if (!sagt.has('grense') && g.år >= TUNING.penger.førsteEkteValg - 1.2) {
        sagt.add('grense');
        const t0 = g.t;
        text.beatOnce('valg', BEAT.valg.tittel, BEAT.valg.tekst, {
            at: c.flate(110, 150),
            until: () => c.spill().t > t0 + 1.4,
        });
    }
    if (!sagt.has('ganger') && g.år >= TUNING.ganger.fra + 0.3) {
        sagt.add('ganger');
        text.point('ganger', LAPP.ganger, c.vedBallong(10), { seconds: 5 });
    }
    if (!sagt.has('bom')) {
        const k = g.ter.knauser.find((kn) => kn.konge && kn.x0 - g.x < 560 && kn.x0 > g.x);
        if (k) {
            sagt.add('bom');
            text.point('bom', LAPP.bom, c.vedVerden((k.x0 + k.x1) / 2, k.bunn + 40), {
                seconds: 4,
            });
        }
    }
    if (!sagt.has('roret') && g.år >= TUNING.veiskille.åpenFra) {
        const k = g.ter.knauser.find((kn) => !kn.konge && kn.x0 > g.x);
        if (k) {
            sagt.add('roret');
            const t0 = g.t;
            text.beatOnce('roret', BEAT.roret.tittel, BEAT.roret.tekst, {
                at: c.vedVerden((k.x0 + k.x1) / 2, k.bunn + 30),
                until: () => c.spill().t > t0 + 1.4,
            });
        }
    }
    if (!sagt.has('sverdrup') && g.år >= TUNING.veiskille.åpenFra + 0.6) {
        sagt.add('sverdrup');
        text.banner('Sverdrup om bord', P.silke);
    }
    // Nesten-bom: hårfint over fjellet.
    const kl = klaring(g);
    if (kl > 0 && kl < 7 && g.t - (c.sist.get('nesten') ?? -9) > 3) {
        c.sist.set('nesten', g.t);
        const p = c.skjerm(BX - 40, g.y + 26);
        text.float('Hårfint!', p.x, p.y, P.hvit);
    }
}
