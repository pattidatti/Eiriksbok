// Setter bildet sammen: himmel, fjell-lag, forgrunn, nær-båndet, hindre, partikler,
// spøkelset, ballongen og til slutt papirmargen med HUD-en. Leser bare spillet.

import type { ArcadeView } from '../arcade/useArcade';
import { P } from './art';
import { tegnBallong, tegnSpøkelse } from './figures';
import { tegnFx, tegnLapper, type Fx } from './fx';
import { tegnHud, tegnRamme } from './hud';
import {
    FONT,
    tegnBakgrunn,
    tegnBaner,
    tegnBånd,
    tegnForgrunn,
    tegnGlød,
    tegnHimmel,
    tegnHindre,
} from './scene';
import type { Game } from './state';
import { TUNING } from './tuning';

export { P };

const B = TUNING.ballong;

export interface Skala {
    s: number;
    ox: number;
    oy: number;
}

export const skala = (w: number, h: number): Skala => {
    const s = Math.min(w / 960, h / 540);
    return { s, ox: (w - 960 * s) / 2, oy: (h - 540 * s) / 2 };
};

/** Et punkt på flata (960 x 540) -> CSS-piksler i spillvinduet. */
export const tilSkjerm = (k: Skala, x: number, y: number) => ({
    x: k.ox + x * k.s,
    y: k.oy + y * k.s,
});

/** Verdens-x -> x på flata. */
export const flateX = (g: Game, x: number) => x - g.x + B.skjermX;

export interface TegneValg {
    spøkelse: number[] | null;
    meny: boolean;
    rekord: number;
    øving: boolean;
    /** Plakaten (selvspillets --cover): bare bildet, uten papirmarg, HUD og lapper. */
    plakat?: boolean;
}

export function tegn(view: ArcadeView, g: Game, fx: Fx, valg: TegneValg) {
    const { ctx, w, h, dpr } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#e4e6db';
    ctx.fillRect(0, 0, w, h);
    const k = skala(w, h);
    ctx.setTransform(dpr * k.s, 0, 0, dpr * k.s, dpr * k.ox, dpr * k.oy);
    const tid = fx.klokke;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 960, 540);
    ctx.clip();
    if (fx.rist > 0) {
        ctx.translate((Math.random() - 0.5) * fx.rist, (Math.random() - 0.5) * fx.rist);
    }
    tegnHimmel(ctx, g, tid);
    tegnBakgrunn(ctx, g);
    tegnForgrunn(ctx, g, tid);
    tegnBaner(ctx, g, tid);
    tegnGlød(ctx, g);
    tegnBånd(ctx, g, tid);
    tegnHindre(ctx, g, tid);
    tegnFx(ctx, fx, 'bak');

    if (valg.spøkelse && !valg.meny && !valg.øving) {
        const y = valg.spøkelse[Math.floor(g.x / 8)];
        if (y !== undefined) tegnSpøkelse(ctx, B.skjermX, y);
    }
    tegnBallong(ctx, B.skjermX, g.y, {
        varme: g.varme,
        hold: g.hold,
        hatter: g.hatter,
        ueland: g.år >= g.uelandÅr,
        sverdrup: g.harRor,
        ganger: g.ganger,
        tid,
        vy: g.vy,
    });
    tegnFx(ctx, fx, 'foran');
    ctx.restore();

    if (valg.plakat) return;
    tegnRamme(ctx, g, valg.meny);
    tegnHud(ctx, g, fx, { meny: valg.meny, rekord: valg.rekord, øving: valg.øving });
    tegnLapper(ctx, fx, FONT);
}
