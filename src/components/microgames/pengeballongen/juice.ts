// Spillfølelsen: hva verden gjør når eleven holder, slipper, skraper og treffer. Leser
// spillet og hendelsene, lager partikler og lyd. Ingen spillregler her.

import { bakke } from './terrain';
import { blink, rist, slipp, stopp, type Fx } from './fx';
import { iBåndet, klaring } from './rules';
import type { Lyd } from './sound';
import type { Game, Hendelse } from './state';
import { TUNING } from './tuning';
import { P } from './art';

const BX = TUNING.ballong.skjermX;
/** Der «Spart»-telleren står i HUD-en. */
const TELLER = { x: 860, y: 44 };

export interface Juice {
    mynt: number;
    gnist: number;
    fly: number;
    nesten: number;
    landetLyd: number;
    stabelVarslet: boolean;
}

export const nyJuice = (): Juice => ({
    mynt: 0,
    gnist: 0,
    fly: 0,
    nesten: 0,
    landetLyd: 0,
    stabelVarslet: false,
});

const r = (a: number, b: number) => a + Math.random() * (b - a);

/** Hver ramme mens runden går. `dt` er spilltid (sakte film teller med). */
export function juice(g: Game, fx: Fx, j: Juice, lyd: Lyd, dt: number, landet: number) {
    const y = g.y;
    const kl = klaring(g);
    const inne = iBåndet(g);
    lyd.løpende(dt, g.hold, inne, g.ganger, kl);
    j.mynt -= dt;
    j.gnist -= dt;
    j.fly -= dt;
    j.nesten -= dt;
    j.landetLyd -= dt;

    // Hold: bonden kaster sølvspesidaler inn i brenneren. Klirr og glør.
    if (g.hold && j.mynt <= 0) {
        j.mynt = 0.09;
        slipp(fx, 'mynt', BX - 9, y - 20, { vx: r(10, 40), vy: r(-190, -150), maks: 0.32, str: 0.8 });
        lyd.klirr();
    }
    if (g.varme > 0.3 && Math.random() < g.varme * 0.5) {
        slipp(fx, 'glo', BX + r(-4, 4), y - 30, { vx: r(-30, 10), vy: r(-40, -10), maks: 0.5 });
    }

    // Roret: ballongen dykker - vindstriper over silken, så styringen kjennes.
    if (g.ror && Math.random() < 0.8) {
        slipp(fx, 'gnist', BX + r(-30, 30), y - r(90, 130), { vx: r(-120, -40), vy: r(-420, -300), maks: 0.22, str: 1.1 });
    }

    // Ueland over ×5: fartsstriper bak ballongen.
    if (g.ganger > 5 && Math.random() < 0.6) {
        slipp(fx, 'gnist', BX - 30, y - r(10, 90), { vx: r(-700, -500), vy: r(-10, 10), maks: 0.25, str: 1.4 });
    }

    // Skraping: gnister fra lyngen under kurven, flere jo større gangeren er.
    if (inne && kl < 34 && j.gnist <= 0) {
        j.gnist = 0.05 / (0.6 + g.ganger * 0.4);
        const by = bakke(g.ter, g.x);
        const n = 1 + Math.floor(g.ganger / 2);
        for (let i = 0; i < n; i++)
            slipp(fx, 'gnist', BX + r(-14, 14), by - 1, {
                vx: r(-260, -120),
                vy: r(-220, -60),
                maks: r(0.2, 0.4),
                str: 0.7 + g.ganger * 0.1,
            });
    }

    // Glidesporet: en stripe av glør etter kurven i båndet, lengre og varmere med gangeren.
    if (inne && !g.hold && Math.random() < 0.4 + g.ganger * 0.12) {
        slipp(fx, 'glo', BX - 6, y - 2 + r(-2, 2), {
            vx: r(-20, 0),
            vy: r(-10, 10),
            maks: 0.3 + g.ganger * 0.12,
            str: 0.8 + g.ganger * 0.2,
            verden: true,
        });
    }

    // Slipp i båndet: sparte mynter fyker opp til telleren (oftere jo større gangeren er).
    if (!g.hold && inne && j.fly <= 0) {
        j.fly = 0.55 / g.ganger;
        slipp(fx, 'mynt', BX - 16, y - 6, { maks: r(0.6, 0.8), mål: TELLER, vr: 10 });
    }
    if (landet > 0) {
        fx.sprett = Math.min(1, fx.sprett + 0.5 * landet);
        if (j.landetLyd <= 0) {
            j.landetLyd = 0.08;
            lyd.spart();
        }
    }

    // Nesten-bom: kurven var en hårsbredd fra fjellet.
    if (kl < 8 && kl > 0 && j.nesten <= 0) {
        j.nesten = 0.9;
        lyd.nesten();
        for (let i = 0; i < 6; i++)
            slipp(fx, 'gnist', BX + r(-10, 10), y + 2, {
                vx: r(-300, -100),
                vy: r(-260, -80),
                maks: 0.35,
                str: 1.3,
            });
    }

    // Stabelen nærmer seg streken.
    const nær = g.år >= TUNING.penger.førsteEkteValg - 1.2 && g.periode > TUNING.penger.grense * 0.8;
    if (nær && !j.stabelVarslet) {
        j.stabelVarslet = true;
        fx.stabelBlink = 1;
    }
    if (!nær) j.stabelVarslet = false;
}

/** Hendelsene fra spillet: partikler, rystelse og lyd. Teksten tar coach.ts seg av. */
export function påHendelse(h: Hendelse, g: Game, fx: Fx, lyd: Lyd) {
    const y = g.y;
    switch (h.slag) {
        case 'ganger':
            if (h.ganger > h.fra) {
                fx.gangerSprett = 1;
                lyd.ganger(h.ganger);
                if (h.ganger === 5 || h.ganger === TUNING.ganger.maks) stopp(fx, 0.06);
                if (h.ganger > 5) {
                    lyd.under();
                    rist(fx, 3);
                    blink(fx, 0.25, P.silke);
                }
                for (let i = 0; i < h.ganger + 1; i++)
                    slipp(fx, 'mynt', BX + r(-10, 10), y - 10, { maks: r(0.5, 0.8), mål: { x: 132, y: 62 } });
            } else lyd.gangerNed();
            break;
        case 'valg': {
            const v = g.ter.valg.find((x) => x.år === h.år);
            const sx = v ? v.x - g.x + BX : BX + 40;
            const by = v ? bakke(g.ter, v.x) : 470;
            if (h.ekte) {
                lyd.valg();
                for (let i = 0; i < 10; i++)
                    slipp(fx, 'lue', sx - 34 - r(0, 30), by - 14, {
                        vx: r(-80, 60),
                        vy: r(-380, -220),
                        maks: 1.4,
                        verden: true,
                    });
            } else lyd.vinker();
            if (h.hatt) {
                lyd.hatt();
                slipp(fx, 'hatt', BX + 40, y - 120, { vx: -50, vy: 60, maks: 0.6, vr: 4 });
            }
            break;
        }
        case 'stemtUt':
            lyd.stemtUt();
            blink(fx, 0.8, P.karmin);
            rist(fx, 10);
            for (let i = 0; i < 14; i++)
                slipp(fx, 'mynt', BX + r(-10, 10), y - 10, {
                    vx: r(-160, 160),
                    vy: r(-260, -60),
                    maks: 1.2,
                });
            break;
        case 'funn':
            stopp(fx, 0.08);
            lyd.funn();
            blink(fx, 0.35);
            fx.sprett = 1;
            slipp(fx, 'papir', BX + 10, y - 20, { maks: 0.7, mål: TELLER, vr: 6 });
            for (let i = 0; i < 8; i++)
                slipp(fx, 'papir', BX + 10, y - 20, { vx: r(-120, 120), vy: r(-160, -40), maks: 1 });
            break;
        case 'veiskille':
            if (h.vei === 'under') {
                stopp(fx, h.port ? 0.12 : 0.06);
                if (h.port) {
                    rist(fx, 6);
                    blink(fx, 0.35, P.silke);
                }
                lyd.under();
                for (let i = 0; i < 10; i++)
                    slipp(fx, 'gnist', BX + r(-20, 20), y - 70, {
                        vx: r(-260, -60),
                        vy: r(-60, 120),
                        maks: 0.4,
                        str: 1.2,
                    });
            }
            break;
        case 'krasj':
            lyd.krasj();
            rist(fx, 16);
            blink(fx, 0.6, P.kritt);
            for (let i = 0; i < 16; i++)
                slipp(fx, 'røyk', BX + r(-20, 20), y - r(10, 60), {
                    vx: r(-60, 60),
                    vy: r(-60, 0),
                    maks: r(0.8, 1.6),
                    str: r(0.6, 1.3),
                });
            for (let i = 0; i < 12; i++)
                slipp(fx, 'mynt', BX, y - 10, { vx: r(-200, 200), vy: r(-300, -80), maks: 1.2 });
            for (let i = 0; i < Math.min(6, g.hatter); i++)
                slipp(fx, 'hatt', BX, y - 20, { vx: r(-150, 150), vy: r(-320, -150), maks: 1.4 });
            break;
        case 'sjanse':
            if (h.årsak === 'valg') lyd.stemtUt();
            else lyd.krasj();
            rist(fx, 12);
            blink(fx, 0.7, h.årsak === 'valg' ? P.karmin : P.kritt);
            for (let i = 0; i < 10; i++)
                slipp(fx, 'mynt', BX + r(-10, 10), y - 10, {
                    vx: r(-160, 160),
                    vy: r(-260, -60),
                    maks: 1,
                });
            break;
        case 'stemme':
            stopp(fx, 0.07);
            lyd.ganger(5);
            fx.gangerSprett = 1;
            for (let i = 0; i < 5; i++)
                slipp(fx, 'papir', BX + r(-8, 8), y - 10, { maks: r(0.5, 0.8), mål: TELLER, vr: 8 });
            for (let i = 0; i < 8; i++)
                slipp(fx, 'gnist', BX + r(-10, 10), y, { vx: r(-200, 200), vy: r(-260, -40), maks: 0.4 });
            break;
        case 'bondeting':
            lyd.valg();
            blink(fx, 0.4, P.silke);
            fx.sprett = 1;
            for (let i = 0; i < 12; i++)
                slipp(fx, 'mynt', BX + r(-10, 10), y - 30, { maks: r(0.6, 0.9), mål: TELLER });
            break;
        case 'roret':
            lyd.funn();
            blink(fx, 0.5);
            break;
        case 'landet':
            lyd.seier();
            blink(fx, 0.5);
            for (let i = 0; i < 24; i++)
                slipp(fx, i % 2 ? 'lue' : 'hatt', BX + r(-40, 200), 470, {
                    vx: r(-80, 80),
                    vy: r(-460, -260),
                    maks: 1.8,
                });
            break;
        default:
            break;
    }
}
