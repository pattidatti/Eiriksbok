// All tekst under runden, via useArcadeText: bannere ved nye brett, lapper ved tingen,
// de tre lærings-øyeblikkene (valget 1833, Ueland, riksretten) og poengtekst som spretter.

import type { ArcadeText } from '../arcade/useArcade';
import type { Anchor } from '../arcade/stores';
import { P } from './art';
import { BRETT, FUNN } from './levels';
import { klaring } from './rules';
import type { Game, Hendelse } from './state';
import { BEAT, LAPP, SJANSE_LÆRDOM } from './texts';
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
            text.banner(BRETT[h.brett].tittel);
            break;
        case 'valg': {
            if (!h.ekte) {
                if (!sagt.has('vinker')) {
                    sagt.add('vinker');
                    text.point('vinker', LAPP.vinker, c.vedBallong(-130), { seconds: 4 });
                } else ved('Bøndene vinker deg forbi', -120, P.halv);
            } else if (h.år === TUNING.penger.førsteEkteValg) {
                text.banner('Bondestortinget!', P.silke);
            } else ved(`Gjenvalgt ${h.år}!`, -120, P.silke, true);
            if (h.hatt) ved('+1 flosshatt', -40, P.karmin);
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
            if (h.konge && h.vei === 'under') ved('Under bommen! Ueland +1', -110, P.silke, true);
            else if (h.hatt) ved('Kongeveien: brenneren dyrere', -120, P.karmin, true);
            break;
        case 'ganger':
            if (h.ganger > h.fra) {
                ved(`Ueland ×${h.ganger}`, -60, P.silke, h.ganger >= 4, 1);
                if (h.ganger === 2)
                    text.beatOnce('ueland', BEAT.ueland.tittel, BEAT.ueland.tekst, {
                        at: c.vedBallong(-60),
                        until: () => c.spill().ganger !== 2,
                    });
            }
            break;
        case 'sjanse':
            text.banner(`Ny sjanse fra ${h.tilbake}`, P.karmin);
            ved(h.årsak === 'valg' ? 'Stemt ut!' : 'Rett i fjellet!', -120, P.karmin, true, 1.8);
            if (h.straff > 0) ved(`-${h.straff} Spd.`, -80, P.karmin, false, 1.8);
            if (!sagt.has('sjanse')) {
                sagt.add('sjanse');
                text.lesson('sjanse', SJANSE_LÆRDOM, 1.5);
            }
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
        text.point('hold', LAPP.hold, c.vedBallong(-50), {
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
    // Budsjettbaren ved ballongen: anker til lærings-øyeblikket om valget.
    const vedBar = () => {
        const sp = c.spill();
        const B = TUNING.ballong;
        return c.skjerm(B.skjermX - B.halvBredde - 26, sp.y - B.høyde + 40);
    };
    if (!sagt.has('grense') && g.år >= TUNING.penger.førsteEkteValg - 1.2) {
        sagt.add('grense');
        const t0 = g.t;
        text.beatOnce('valg', BEAT.valg.tittel, BEAT.valg.tekst, {
            at: vedBar,
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
    if (!sagt.has('sverdrup') && g.år >= TUNING.veiskille.åpenFra + 0.6) {
        sagt.add('sverdrup');
        text.banner('Sverdrup om bord', P.silke);
    }
    // Nesten-bom: hårfint over fjellet.
    const kl = klaring(g);
    if (kl > 0 && kl < 7 && g.t - (c.sist.get('nesten') ?? -9) > 3) {
        c.sist.set('nesten', g.t);
        c.lapp('Hårfint!', BX - 70, g.y + 10, P.silke, false, 0.9);
    }
}
